import { NextRequest, NextResponse } from 'next/server';
import { verifySmtpConnection } from '@/lib/email';

// Debug endpoint to test email configuration
// Access: GET /api/debug/smtp?key=your-secret-key
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  const debugKey = process.env.DEBUG_KEY;

  if (!debugKey) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  if (key !== debugKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const envCheck = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓ set' : '✗ not set',
      RESEND_FROM: process.env.RESEND_FROM ? '✓ set' : '✗ not set',
      ADMIN_EMAIL_RECIPIENTS: process.env.ADMIN_EMAIL_RECIPIENTS || 'using defaults',
    };

    const emailResult = await verifySmtpConnection();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVariables: envCheck,
      emailTest: emailResult,
      instructions: emailResult.success
        ? 'Resend API configured! Emails should work.'
        : `Email configuration issue. Error: ${emailResult.error}. Check your RESEND_API_KEY.`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
