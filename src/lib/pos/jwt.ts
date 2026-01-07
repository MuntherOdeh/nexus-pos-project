import { jwtVerify, SignJWT } from "jose";
import type { TenantUserRole } from "@prisma/client";
import { randomBytes } from "crypto";

export type PosJwtPayload = {
  tenantSlug: string;
  tenantUserId: string;
  role: TenantUserRole;
};

export function getJwtSecret(): Uint8Array | null {
  const jwtSecretValue = process.env.JWT_SECRET;

  if (jwtSecretValue) {
    return new TextEncoder().encode(jwtSecretValue);
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return new TextEncoder().encode("your-super-secret-jwt-key-change-in-production");
}

export async function signPosToken(params: {
  payload: PosJwtPayload;
  expiresIn: string;
}): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[pos-auth] JWT_SECRET is not set; using opaque session tokens.");
    }
    return `pos_${randomBytes(32).toString("hex")}`;
  }

  return new SignJWT(params.payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(params.expiresIn)
    .sign(secret);
}

export async function verifyPosToken(token: string): Promise<PosJwtPayload | null> {
  try {
    const secret = getJwtSecret();
    if (!secret) return null;

    const { payload } = await jwtVerify(token, secret);
    const tenantSlug = payload.tenantSlug as string | undefined;
    const tenantUserId = payload.tenantUserId as string | undefined;
    const role = payload.role as TenantUserRole | undefined;

    if (!tenantSlug || !tenantUserId || !role) return null;

    return { tenantSlug, tenantUserId, role };
  } catch {
    return null;
  }
}
