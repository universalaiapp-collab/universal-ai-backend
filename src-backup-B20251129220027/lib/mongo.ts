import { MongoClient, Db } from "mongodb";

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const MONGO_DB = process.env.MONGO_DB || "universalai";

let clientPromise: Promise<MongoClient> | null = null;

async function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = MongoClient.connect(MONGO_URL, { maxPoolSize: 10 });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(MONGO_DB);
}

export async function initMongo(): Promise<void> {
  try {
    const db = await getDb();
    const coll = db.collection("metrics");

    // indexes for faster queries / optional TTL
    await coll.createIndex({ timestamp: 1 });
    await coll.createIndex({ route: 1 });
    await coll.createIndex({ provider: 1, timestamp: -1 });

    console.info("[MONGO] indexes ensured on metrics collection");
  } catch (err) {
    console.error("[MONGO] init error (non-fatal):", err);
  }
}
