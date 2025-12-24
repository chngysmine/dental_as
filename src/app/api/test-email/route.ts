import { NextResponse } from "next/server";
import resend from "@/lib/resend";

/**
 * Test endpoint để kiểm tra cấu hình email
 * GET /api/test-email
 */
export async function GET() {
  try {
    // Check RESEND_API_KEY
    const apiKey = process.env.RESEND_API_KEY;
    
    const diagnostics = {
      hasApiKey: !!apiKey,
      apiKeyFormat: apiKey ? (apiKey.startsWith("re_") ? "valid" : "invalid") : "missing",
      apiKeyLength: apiKey?.length || 0,
      resendInstance: !!resend,
      fromEmail: process.env.RESEND_FROM_EMAIL || "DentWise <onboarding@resend.dev>",
      replyToEmail: process.env.RESEND_REPLY_TO_EMAIL || "support@dentwise.com",
      nodeEnv: process.env.NODE_ENV,
    };

    // Try to send a test email if API key is configured
    if (apiKey && resend) {
      try {
        const testEmail = "test@example.com"; // Change this to your email for testing
        const { data, error } = await resend.emails.send({
          from: diagnostics.fromEmail,
          to: [testEmail],
          subject: "Test Email from DentWise API",
          html: "<h1>Test Email</h1><p>This is a test email to verify email configuration.</p>",
          text: "Test Email\n\nThis is a test email to verify email configuration.",
        });

        return NextResponse.json({
          ...diagnostics,
          testEmailSent: !error && !!data?.id,
          testEmailId: data?.id,
          testError: error,
          message: error 
            ? "API key is configured but email sending failed. Check error details."
            : "Email configuration looks good! Test email sent successfully.",
        });
      } catch (testError: any) {
        return NextResponse.json({
          ...diagnostics,
          testEmailSent: false,
          testError: {
            message: testError?.message,
            name: testError?.name,
          },
          message: "API key is configured but test email failed.",
        });
      }
    }

    return NextResponse.json({
      ...diagnostics,
      message: apiKey 
        ? "API key found but Resend instance not created. Check API key format."
        : "RESEND_API_KEY is not configured. Add it to .env.local file.",
      instructions: {
        step1: "Create or edit .env.local file in project root",
        step2: "Add: RESEND_API_KEY=re_your_api_key_here",
        step3: "Get API key from: https://resend.com/api-keys",
        step4: "Restart dev server: npm run dev",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to check email configuration",
        message: error?.message,
        details: error,
      },
      { status: 500 }
    );
  }
}

