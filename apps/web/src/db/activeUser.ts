export const DEMO_USER_ID = 'demo';

let currentActiveUserId: string = DEMO_USER_ID;
const activeUserListeners = new Set<(userId: string) => void>();

export function getActiveUserId(): string {
  return currentActiveUserId;
}

export function setActiveUserId(userId: string | null | undefined): void {
  const nextId = userId && userId.trim() ? userId.trim() : DEMO_USER_ID;
  if (currentActiveUserId !== nextId) {
    currentActiveUserId = nextId;
    activeUserListeners.forEach((listener) => listener(currentActiveUserId));
  }
}

export function subscribeActiveUserId(listener: (userId: string) => void): () => void {
  activeUserListeners.add(listener);
  return () => {
    activeUserListeners.delete(listener);
  };
}

