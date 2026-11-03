import mongoose from 'mongoose';
import { ENV } from '../env';

let isConnected = false;

export async function connectDB(uri: string = ENV.MONGODB_URI): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`[MongoDB] Connected to ${sanitizedUri}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
