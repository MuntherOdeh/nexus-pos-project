import { NextRequest, NextResponse } from 'next/server';
import { sendContactNotification, verifySmtpConnection } from '@/lib/email';

// Test endpoint to send a real email
// Access: GET /api/debug/test-email?key=your-secret-key&to=email@example.com
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');
  const testEmail = searchParams.get('to');

  const debugKey = process.env.DEBUG_KEY || 'scopecode-debug-2024';

  if (key !== debugKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Verifying Resend API connection...');
    const apiVerify = await verifySmtpConnection();

    const testData = {
      name: 'Test User',
      email: testEmail || 'test@example.com',
      phone: '+971 50 123 4567',
      subject: 'Test Email from ScopeCode',
      message: 'This is a test message to verify email configuration is working correctly.',
    };

    console.log('Attempting to send test email...');
    console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_FROM:', process.env.RESEND_FROM);

    const emailSent = await sendContactNotification(testData);

    return NextResponse.json({
      success: emailSent,
      timestamp: new Date().toISOString(),
      testData,
      apiVerification: apiVerify,
      environment: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓ set' : '✗ not set',
        RESEND_FROM: process.env.RESEND_FROM || 'not set',
        ADMIN_EMAIL_RECIPIENTS: process.env.ADMIN_EMAIL_RECIPIENTS || 'using defaults',
      },
      message: emailSent
        ? 'Test email sent successfully! Check your inbox.'
        : 'Failed to send test email. Check server logs for details.',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Test email error:', errorMessage);
    console.error('Stack:', errorStack);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
  }
}
