import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

declare global {
  var __prismaClient: PrismaClient | undefined;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  console.log(" Prisma DB - DATABASE_URL:", databaseUrl ? "... loaded" : " missing");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL missing in prisma.ts");
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (!globalThis.__prismaClient) {
    globalThis.__prismaClient = createPrismaClient();
  }

  return globalThis.__prismaClient;
}

export function getDb() {
  return getPrismaClient();
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
  set(_target, prop, value) {
    return Reflect.set(getPrismaClient(), prop, value);
  },
  has(_target, prop) {
    return prop in getPrismaClient();
  },
  ownKeys() {
    return Reflect.ownKeys(getPrismaClient());
  },
  getOwnPropertyDescriptor(_target, prop) {
    const descriptor = Object.getOwnPropertyDescriptor(getPrismaClient(), prop);
    if (descriptor) {
      descriptor.configurable = true;
    }
    return descriptor;
  },
}) as PrismaClient;
