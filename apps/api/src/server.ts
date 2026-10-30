import { app } from './app';
import { ENV } from './env';
import { connectDB } from './db/connection';

async function bootstrap() {
  try {
    await connectDB(ENV.MONGODB_URI);
    app.listen(ENV.PORT, () => {
      console.log(`[SyncTask API] listening on http://localhost:${ENV.PORT}`);
    });
  } catch (err) {
    console.error('[SyncTask API] Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();
