import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  mongoose.set("strictQuery", true);
  connectionPromise = mongoose.connect(env.mongodbUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10_000,
  });
  try {
    await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
