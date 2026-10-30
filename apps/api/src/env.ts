import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  WEB_ORIGIN: process.env.WEB_ORIGIN || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'synctask-development-jwt-secret-key-32-chars-min',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/synctask',
};
