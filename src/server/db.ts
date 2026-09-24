import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/paa_sentinel';

let isConnected = false;
let connectionError: string | null = null;

export async function connectToDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  try {
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    console.log(`[PAA Sentinel Server] Connecting to MongoDB at: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}...`);
    
    mongoose.set('strictQuery', false);
    mongoose.set('bufferCommands', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    connectionError = null;
    console.log(`[PAA Sentinel Server] Successfully connected to MongoDB Database: "${mongoose.connection.name}"`);
    return true;
  } catch (err: any) {
    isConnected = false;
    connectionError = err.message || 'Failed to connect to MongoDB';
    console.warn(`[PAA Sentinel Server] MongoDB connection warning: ${connectionError}`);
    console.warn(`[PAA Sentinel Server] App will operate with in-memory / local storage fallback until MongoDB is started.`);
    return false;
  }
}

export function getDatabaseStatus() {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    dbName: mongoose.connection.name || 'paa_sentinel',
    host: mongoose.connection.host || '127.0.0.1',
    port: mongoose.connection.port || 27017,
    uriUsed: (process.env.MONGODB_URI || DEFAULT_MONGO_URI).replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
    error: connectionError,
  };
}
