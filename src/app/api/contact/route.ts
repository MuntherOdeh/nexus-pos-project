import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/utils';
import { sendContactNotification } from '@/lib/email';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    
    const { success, remaining } = await limiter.check(ip, 5); // 5 requests per minute
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': '60',
          }
        }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = contactSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input',
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = validationResult.data;

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      phone: phone ? sanitizeInput(phone) : null,
      subject: sanitizeInput(subject),
      message: sanitizeInput(message),
    };

    // Store in database
    const contact = await prisma.contact.create({
      data: sanitizedData,
    });

    // Log the submission
    await prisma.auditLog.create({
      data: {
        action: 'CONTACT_FORM_SUBMISSION',
        entityType: 'Contact',
        entityId: contact.id,
        details: JSON.stringify({
          email: sanitizedData.email,
          subject: sanitizedData.subject,
        }),
        ipAddress: ip,
      },
    });

    // Send email notification in background (fire and forget)
    // Don't await - this prevents Vercel timeout issues with slow SMTP servers
    sendContactNotification(sanitizedData).catch((emailError) => {
      console.error('Failed to send email notification:', emailError);
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message. We will get back to you shortly!',
        id: contact.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
