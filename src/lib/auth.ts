import { jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET: Uint8Array | null = (() => {
  const jwtSecretValue = process.env.JWT_SECRET;

  if (jwtSecretValue) {
    return new TextEncoder().encode(jwtSecretValue);
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return new TextEncoder().encode('your-super-secret-jwt-key-change-in-production');
})();

export interface AuthPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
}

export async function verifyAuth(token: string): Promise<AuthPayload | null> {
  try {
    if (!JWT_SECRET) return null;

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if session exists and is not expired
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        admin: true,
      },
    });

    if (!session || !session.admin.isActive) {
      return null;
    }

    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      role: payload.role as 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER',
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function requireAuth(
  token: string | undefined,
  requiredRoles?: ('SUPER_ADMIN' | 'ADMIN' | 'VIEWER')[]
): Promise<{ success: true; auth: AuthPayload } | { success: false; error: string; status: number }> {
  if (!token) {
    return { success: false, error: 'Authentication required', status: 401 };
  }

  const auth = await verifyAuth(token);

  if (!auth) {
    return { success: false, error: 'Invalid or expired token', status: 401 };
  }

  if (requiredRoles && !requiredRoles.includes(auth.role)) {
    return { success: false, error: 'Insufficient permissions', status: 403 };
  }

  return { success: true, auth };
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}
