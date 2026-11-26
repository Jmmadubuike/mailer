import "server-only";
import mongoose from "mongoose";
import { getEnv } from "@/config/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mailerMongoose: MongooseCache | undefined;
}

const globalCache = (globalThis as { __mailerMongoose?: MongooseCache })
  .__mailerMongoose ?? { conn: null, promise: null };

(globalThis as { __mailerMongoose?: MongooseCache }).__mailerMongoose =
  globalCache;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalCache.promise) {
    const uri = getEnv().DATABASE_URL;
    globalCache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
  } catch (error) {
    globalCache.promise = null;
    throw error;
  }

  return globalCache.conn;
}
