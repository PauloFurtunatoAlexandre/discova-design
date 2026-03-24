import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

// Validate required env at startup — fail fast, not silently
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Use unpooled URL for migrations, pooled URL for queries
const connectionString =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.DATABASE_URL

// Singleton pattern — prevent multiple connections in development (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined
}

function createDb() {
  const client = postgres(connectionString!, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
  })
  return drizzle(client, { schema, logger: process.env.NODE_ENV === "development" })
}

export const db = globalThis.__db ?? createDb()

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db
}

export type Database = typeof db
