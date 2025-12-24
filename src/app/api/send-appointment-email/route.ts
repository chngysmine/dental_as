import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import React from "react";
import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import resend from "@/lib/resend";

// Function to generate plain text version of the email
function generatePlainTextEmail(props: {
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  duration: string;
  price: string;
}): string {
  return `
DentWise - Appointment Confirmation

Your dental appointment has been successfully booked.

APPOINTMENT DETAILS:
--------------------
Doctor: ${props.doctorName}
Appointment Type: ${props.appointmentType}
Date: ${props.appointmentDate}
Time: ${props.appointmentTime}
Duration: ${props.duration}
Cost: ${props.price}
Location: Dental Center

IMPORTANT INFORMATION:
----------------------
- Please arrive 15 minutes early for your appointment
- If you need to reschedule or cancel, please contact us at least 24 hours in advance

View your appointments: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/appointments

Best regards,
The DentWise Team

If you have any questions, please contact us at support@dentwise.com

This is an automated confirmation email. If you did not book this appointment, please ignore this message.
  `.trim();
}

export async function POST(request: Request) {
  console.log("📧 Email API called at:", new Date().toISOString());
  
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
      console.log("✅ Request body parsed successfully");
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          error: "Invalid request body",
          message:
            parseError instanceof Error
              ? parseError.message
              : "Could not parse JSON",
        },
        { status: 400 },
      );
    }

    const {
      userEmail,
      doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType,
      duration,
      price,
    } = body;

    // validate required fields
    if (!userEmail || !doctorName || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if RESEND_API_KEY is configured
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error(
        "❌ RESEND_API_KEY is not configured in environment variables",
      );
      console.error("Please add RESEND_API_KEY to your .env.local file");
      console.error("Get API key from: https://resend.com/api-keys");
      return NextResponse.json(
        {
          error: "Email service is not configured. Please contact support.",
          message: "RESEND_API_KEY environment variable is missing",
          instructions: {
            step1: "Create or edit .env.local file in project root",
            step2: "Add: RESEND_API_KEY=re_your_api_key_here",
            step3: "Get API key from: https://resend.com/api-keys",
            step4: "Restart dev server: npm run dev",
          },
        },
        { status: 500 },
      );
    }

    if (!resend) {
      console.error("❌ Resend instance is null - API key may be invalid");
      console.error("API key format:", apiKey.startsWith("re_") ? "valid" : "invalid");
      return NextResponse.json(
        {
          error: "Email service is not configured properly.",
          message: "Resend instance could not be created. Check API key format.",
          apiKeyFormat: apiKey.startsWith("re_") ? "valid" : "invalid",
        },
        { status: 500 },
      );
    }

    console.log("✅ RESEND_API_KEY is configured");
    console.log("✅ Resend instance is ready");

    // Prepare email props with defaults
    const emailProps = {
      doctorName,
      appointmentDate,
      appointmentTime,
      appointmentType: appointmentType || "General Consultation",
      duration: duration || "30 min",
      price: price || "$50",
    };

    // Log for debugging
    console.log("Sending email with props:", {
      userEmail,
      ...emailProps,
    });

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        return NextResponse.json(
          { error: "Invalid email address format" },
          { status: 400 },
        );
      }

      // Create React element from component
      let emailComponent;
      try {
        emailComponent = React.createElement(
          AppointmentConfirmationEmail,
          emailProps,
        );
        console.log("Email component created successfully");
      } catch (componentError: any) {
        console.error("❌ Failed to create email component:", componentError);
        return NextResponse.json(
          {
            error: "Failed to create email template",
            message: componentError?.message || "Unknown error creating email component",
          },
          { status: 500 },
        );
      }

      // Render React component to HTML using @react-email/render
      let emailHtml: string;
      try {
        emailHtml = await render(emailComponent);
        console.log("Email HTML rendered successfully");
      } catch (renderError: any) {
        console.error("❌ Failed to render email HTML:", renderError);
        return NextResponse.json(
          {
            error: "Failed to render email template",
            message: renderError?.message || "Unknown error rendering email",
          },
          { status: 500 },
        );
      }

      // Generate plain text version
      const emailText = generatePlainTextEmail(emailProps);
      console.log("Plain text email generated successfully");

      // Determine from address - use verified domain if available, otherwise use resend.dev
      const fromAddress =
        process.env.RESEND_FROM_EMAIL || "DentWise <onboarding@resend.dev>";
      const replyToAddress =
        process.env.RESEND_REPLY_TO_EMAIL || "support@dentwise.com";

      // send the email with improved configuration
      console.log("Calling Resend API...");
      console.log("Email details:", {
        from: fromAddress,
        to: userEmail,
        subject: "Appointment Confirmation - DentWise",
      });
      
      if (!resend) {
        throw new Error("Resend instance is null");
      }
      
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [userEmail],
        replyTo: replyToAddress,
        subject: "Appointment Confirmation - DentWise",
        html: emailHtml,
        text: emailText,
        headers: {
          "X-Entity-Ref-ID": `appointment-${Date.now()}`,
        },
        tags: [
          {
            name: "category",
            value: "appointment_confirmation",
          },
        ],
      });

      console.log("Resend API response:", {
        hasData: !!data,
        hasError: !!error,
        errorDetails: error,
        dataId: data?.id,
        dataDetails: data,
      });

      if (error) {
        console.error("❌ Resend API error:", error);
        
        // Check for specific validation errors
        let errorMessage = "Failed to send email";
        let instructions: any = undefined;
        
        if (error.name === "validation_error" || error.statusCode === 403) {
          // This is the common error: can only send to own email in test mode
          errorMessage = error.message || "Email sending is restricted in test mode";
          instructions = {
            issue: "Resend API key is in test mode",
            solution: "You can only send emails to your verified email address in test mode",
            steps: [
              "Option 1: Send email only to your verified email (qimin020104@gmail.com) for testing",
              "Option 2: Verify a domain at https://resend.com/domains to send to any email",
              "After verifying domain, update RESEND_FROM_EMAIL in .env.local",
            ],
            verifiedEmail: "qimin020104@gmail.com",
            verifyDomainUrl: "https://resend.com/domains",
          };
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: error,
            instructions,
          },
          { status: 500 },
        );
      }

      if (!data || !data.id) {
        console.warn("Resend returned success but no email ID. Response:", {
          data,
          error,
        });
        return NextResponse.json(
          {
            error: "Email may not have been sent",
            message: "Resend API returned success but no email ID was provided",
            details: { data, error },
          },
          { status: 500 },
        );
      }

      console.log("✅ Email sent successfully!");
      console.log("Email ID:", data.id);
      console.log("To:", userEmail);
      console.log("From:", fromAddress);
      console.log("Reply-To:", replyToAddress);
      
      // Warning about potential bounce with test domain
      if (fromAddress.includes("resend.dev")) {
        console.warn("⚠️ Using test domain (resend.dev) - email may be bounced by Gmail");
        console.warn("💡 To avoid bounce, verify a domain at: https://resend.com/domains");
      }

      return NextResponse.json(
        {
          message: "Email sent successfully",
          emailId: data.id,
          to: userEmail,
        },
        { status: 200 },
      );
    } catch (resendError: any) {
      console.error("Error in Resend API call:", resendError);
      console.error("Resend error details:", {
        message: resendError?.message,
        stack: resendError?.stack,
        name: resendError?.name,
        cause: resendError?.cause,
      });

      // Return error immediately instead of re-throwing
      return NextResponse.json(
        {
          error: "Failed to send email",
          message:
            resendError?.message ||
            "Unknown error occurred while sending email",
          name: resendError?.name || "ResendError",
          // Only include stack in development
          ...(process.env.NODE_ENV === "development" && {
            stack: resendError?.stack,
            details: resendError,
          }),
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Email sending error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
    });

    // Ensure we always return a valid JSON response
    try {
      const errorMessage = error?.message || "Unknown error occurred";
      const errorName = error?.name || "Error";

      return NextResponse.json(
        {
          error: "Internal server error",
          message: errorMessage,
          name: errorName,
          // Only include stack in development
          ...(process.env.NODE_ENV === "development" && {
            stack: error?.stack,
            details: String(error),
          }),
        },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (responseError) {
      // Fallback if even creating the response fails
      console.error("Critical error creating error response:", responseError);
      return new NextResponse(
        JSON.stringify({
          error: "Internal server error",
          message: "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }
}
