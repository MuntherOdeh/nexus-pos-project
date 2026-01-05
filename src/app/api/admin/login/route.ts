import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    const jwtSecretValue = process.env.JWT_SECRET;
    if (!jwtSecretValue && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Server misconfigured: JWT_SECRET is not set' },
        { status: 500 }
      );
    }

    const JWT_SECRET = new TextEncoder().encode(
      jwtSecretValue || 'your-super-secret-jwt-key-change-in-production'
    );

    // Rate limiting - stricter for login
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    
    const { success, remaining } = await limiter.check(ip, 5); // 5 attempts per minute
    
    if (!success) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_RATE_LIMITED',
          entityType: 'Admin',
          details: JSON.stringify({ ip }),
          ipAddress: ip,
        },
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials' 
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin || !admin.isActive) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entityType: 'Admin',
          details: JSON.stringify({ email, reason: 'User not found or inactive' }),
          ipAddress: ip,
        },
      });

      // Use generic error to prevent user enumeration
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      // Log failed attempt
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entityType: 'Admin',
          entityId: admin.id,
          details: JSON.stringify({ reason: 'Invalid password' }),
          ipAddress: ip,
        },
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email or password' 
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await new SignJWT({ 
      adminId: admin.id, 
      email: admin.email,
      role: admin.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Create session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.session.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'Unknown',
      },
    });

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        entityType: 'Admin',
        entityId: admin.id,
        adminId: admin.id,
        ipAddress: ip,
      },
    });

    // Set HTTP-only cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
}
