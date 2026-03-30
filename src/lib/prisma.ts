import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function buildConnectionString(): string {
  const baseUrl = process.env.DATABASE_URL!;
  const rawPassword = process.env.DATABASE_PASSWORD;
  if (!rawPassword) return baseUrl;

  const url = new URL(baseUrl);
  url.password = rawPassword;
  return url.toString();
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: buildConnectionString() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
