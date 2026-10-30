import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  RegisterInputSchema,
  LoginInputSchema,
  UpdateProfileInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  DeleteAccountInputSchema,
  OAuthLoginInputSchema,
  DEFAULT_LISTS,
} from '@synctask/shared';
import {
  UserModel,
  UserSettingsModel,
  PasswordResetModel,
  TaskModel,
  SubtaskModel,
  ListModel,
  NotificationModel,
  ProcessedMutationModel,
} from '../models';
import { hashPassword, verifyPassword } from '../lib/passwords';
import { signToken, setAuthCookie, clearAuthCookie } from '../lib/tokens';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { ENV } from '../env';

export const authRouter = Router();

// Register new user
authRouter.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration details',
        details: parsed.error.format(),
      },
    });
    return;
  }

  const { email, password, username } = parsed.data;

  // Check if email already taken
  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(409).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists',
      },
    });
    return;
  }

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  // Create user
  const user = await UserModel.create({
    _id: userId,
    email,
    passwordHash,
    username,
    cursor: 0,
  });

  // Create default settings document
  await UserSettingsModel.create({
    _id: userId,
    userId,
    theme: 'system',
    weekStart: 'mon',
    timeFormat: '24h',
    defaultReminderMin: 30,
    quietEnabled: false,
    quietStart: '22:00',
    quietEnd: '07:00',
    browserNotifications: false,
    rev: 0,
    updatedAt: nowIso,
  });

  const token = signToken({ userId: user._id, email: user.email });
  setAuthCookie(res, token);

  res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      cursor: user.cursor,
    },
    token,
  });
});

// Login existing user
authRouter.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid login details',
        details: parsed.error.format(),
      },
    });
    return;
  }

  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
    return;
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    res.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
    return;
  }

  const token = signToken({ userId: user._id, email: user.email });
  setAuthCookie(res, token);

  res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      cursor: user.cursor,
    },
    token,
  });
});

// Logout
authRouter.post('/logout', (_req: Request, res: Response): void => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Current user profile
export async function getMeHandler(req: Request, res: Response): Promise<void> {
  const user = await UserModel.findById(req.user!.userId);
  if (!user) {
    clearAuthCookie(res);
    res.status(401).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User session is no longer valid',
      },
    });
    return;
  }

  res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      cursor: user.cursor,
    },
  });
}

authRouter.get('/me', requireAuth, getMeHandler);

/**
 * PUT /api/auth/profile (FR-AUTH-4)
 * Update username, avatar, and/or password
 */
authRouter.put('/profile', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateProfileInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid profile details',
        details: parsed.error.format(),
      },
    });
    return;
  }

  const userId = req.user!.userId;
  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      },
    });
    return;
  }

  const { username, avatarUrl, currentPassword, newPassword } = parsed.data;

  // Handle password update if requested
  if (newPassword) {
    const isValid = await verifyPassword(user.passwordHash, currentPassword || '');
    if (!isValid) {
      res.status(400).json({
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'The current password you entered is incorrect',
        },
      });
      return;
    }
    user.passwordHash = await hashPassword(newPassword);
  }

  if (username) {
    user.username = username;
  }

  if (avatarUrl !== undefined) {
    user.avatarUrl = avatarUrl;
  }

  await user.save();

  res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      cursor: user.cursor,
    },
  });
});

/**
 * POST /api/auth/oauth (FR-AUTH-5)
 * Handles Google / GitHub OAuth login with account linking by verified email
 */
authRouter.post('/oauth', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = OAuthLoginInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid OAuth login details',
        details: parsed.error.format(),
      },
    });
    return;
  }

  const { email, name, provider, avatarUrl } = parsed.data;
  let user = await UserModel.findOne({ email });

  if (user) {
    // Account linking: update avatar if present and not set
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
      await user.save();
    }
  } else {
    // Create new OAuth user
    const userId = crypto.randomUUID();
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const passwordHash = await hashPassword(randomPassword);

    user = await UserModel.create({
      _id: userId,
      email,
      username: name,
      passwordHash,
      avatarUrl: avatarUrl || null,
      authProvider: provider,
      cursor: 0,
    });

    const nowIso = new Date().toISOString();
    await UserSettingsModel.create({
      _id: userId,
      userId,
      theme: 'system',
      weekStart: 'mon',
      timeFormat: '24h',
      defaultReminderMin: 30,
      quietEnabled: false,
      quietStart: '22:00',
      quietEnd: '07:00',
      browserNotifications: false,
      rev: 0,
      updatedAt: nowIso,
    });

    // Seed default lists for this user
    for (let i = 0; i < DEFAULT_LISTS.length; i++) {
      const def = DEFAULT_LISTS[i];
      await ListModel.create({
        _id: crypto.randomUUID(),
        userId,
        name: def.name,
        color: def.color,
        position: i,
        rev: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        deletedAt: null,
      });
    }
  }

  const token = signToken({ userId: user._id, email: user.email });
  setAuthCookie(res, token);

  res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl || null,
      cursor: user.cursor,
    },
    token,
  });
});

/**
 * POST /api/auth/forgot-password (FR-AUTH-6)
 * Generates a 1-hour password reset token and logs the reset link to server console
 */
authRouter.post(
  '/forgot-password',
  authLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = ForgotPasswordInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email address',
          details: parsed.error.format(),
        },
      });
      return;
    }

    const { email } = parsed.data;
    const user = await UserModel.findOne({ email });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Clean up any existing tokens for this user
      await PasswordResetModel.deleteMany({ userId: user._id });

      await PasswordResetModel.create({
        _id: tokenHash,
        userId: user._id,
        expiresAt,
        used: false,
      });

      const resetUrl = `${ENV.WEB_ORIGIN}/reset-password?token=${rawToken}`;
      console.log(`[PASSWORD RESET DEV LINK] For ${user.email}: ${resetUrl}`);
    }

    // Consistent response to prevent user enumeration
    res.json({
      ok: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
    });
  }
);

/**
 * POST /api/auth/reset-password (FR-AUTH-6)
 * Verifies reset token and updates password
 */
authRouter.post(
  '/reset-password',
  authLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = ResetPasswordInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid reset payload',
          details: parsed.error.format(),
        },
      });
      return;
    }

    const { token, newPassword } = parsed.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await PasswordResetModel.findById(tokenHash);
    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      res.status(400).json({
        error: {
          code: 'INVALID_OR_EXPIRED_TOKEN',
          message: 'The password reset link is invalid or has expired.',
        },
      });
      return;
    }

    const user = await UserModel.findById(resetRecord.userId);
    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists',
        },
      });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    res.json({
      ok: true,
      message: 'Password successfully updated. You may now log in.',
    });
  }
);

/**
 * GET /api/auth/export (FR-GAP-6)
 * Export all data as JSON
 */
authRouter.get('/export', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const [user, lists, tasks, subtasks, notifications, settings] = await Promise.all([
    UserModel.findById(userId).lean(),
    ListModel.find({ userId, deletedAt: null }).lean(),
    TaskModel.find({ userId, deletedAt: null }).lean(),
    SubtaskModel.find({ userId, deletedAt: null }).lean(),
    NotificationModel.find({ userId, deletedAt: null }).lean(),
    UserSettingsModel.findOne({ userId }).lean(),
  ]);

  const mapDoc = (doc: any) => {
    if (!doc) return null;
    const { _id, __v, passwordHash, ...rest } = doc;
    return { id: _id, ...rest };
  };

  const exportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    user: mapDoc(user),
    lists: lists.map(mapDoc),
    tasks: tasks.map(mapDoc),
    subtasks: subtasks.map(mapDoc),
    notifications: notifications.map(mapDoc),
    settings: mapDoc(settings),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="synctask-export-${new Date().toISOString().slice(0, 10)}.json"`
  );
  res.json(exportPayload);
});

/**
 * POST /api/auth/delete-account (FR-GAP-6)
 * Cascade delete all user documents and clear auth session
 */
authRouter.post(
  '/delete-account',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = DeleteAccountInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid delete account confirmation',
          details: parsed.error.format(),
        },
      });
      return;
    }

    const userId = req.user!.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    if (parsed.data.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      res.status(400).json({
        error: {
          code: 'EMAIL_MISMATCH',
          message: 'Confirmation email does not match your account email address',
        },
      });
      return;
    }

    // Cascade delete all documents associated with this user
    await Promise.all([
      TaskModel.deleteMany({ userId }),
      SubtaskModel.deleteMany({ userId }),
      ListModel.deleteMany({ userId }),
      NotificationModel.deleteMany({ userId }),
      UserSettingsModel.deleteMany({ userId }),
      ProcessedMutationModel.deleteMany({ userId }),
      PasswordResetModel.deleteMany({ userId }),
      UserModel.findByIdAndDelete(userId),
    ]);

    clearAuthCookie(res);
    res.json({ ok: true, message: 'Account and associated data deleted permanently.' });
  }
);
