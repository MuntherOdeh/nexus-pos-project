import { PrismaClient } from "@prisma/client";

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function resolveDatabaseUrl(): string | undefined {
  const databaseUrl = normalizeEnvValue(process.env.DATABASE_URL);
  const vercelPrismaUrl = normalizeEnvValue(process.env.POSTGRES_PRISMA_URL);
  const vercelNonPoolingUrl = normalizeEnvValue(process.env.POSTGRES_URL_NON_POOLING);
  const vercelUrl = normalizeEnvValue(process.env.POSTGRES_URL);
  const vercelNoSslUrl = normalizeEnvValue(process.env.POSTGRES_URL_NO_SSL);

  const isLocalDatabaseUrl = (url: string) =>
    url.includes("localhost") || url.includes("127.0.0.1") || url.includes("0.0.0.0");

  if (databaseUrl && !isLocalDatabaseUrl(databaseUrl)) return databaseUrl;

  // Vercel Postgres integration (preferred for Prisma)
  return vercelPrismaUrl || vercelNonPoolingUrl || vercelUrl || vercelNoSslUrl || databaseUrl;
}

const resolvedDatabaseUrl = resolveDatabaseUrl();
if (resolvedDatabaseUrl && resolvedDatabaseUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
