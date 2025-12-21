import AppointmentConfirmationEmail from "@/components/emails/AppointmentConfirmationEmail";
import resend from "@/lib/resend";
import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import React from "react";

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
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { 
          error: "Invalid request body",
          message: parseError instanceof Error ? parseError.message : "Could not parse JSON"
        },
        { status: 400 }
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error("❌ RESEND_API_KEY is not configured in environment variables");
      console.error("Please add RESEND_API_KEY to your .env.local file");
      return NextResponse.json(
        { 
          error: "Email service is not configured. Please contact support.",
          message: "RESEND_API_KEY environment variable is missing"
        },
        { status: 500 }
      );
    }
    
    console.log("✅ RESEND_API_KEY is configured");

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
          { status: 400 }
        );
      }

      // Create React element from component
      const emailComponent = React.createElement(AppointmentConfirmationEmail, emailProps);
      console.log("Email component created successfully");

      // Render React component to HTML using @react-email/render
      const emailHtml = await render(emailComponent);
      console.log("Email HTML rendered successfully");

      // Generate plain text version
      const emailText = generatePlainTextEmail(emailProps);
      console.log("Plain text email generated successfully");

      // Determine from address - use verified domain if available, otherwise use resend.dev
      const fromAddress = process.env.RESEND_FROM_EMAIL || "DentWise <onboarding@resend.dev>";
      const replyToAddress = process.env.RESEND_REPLY_TO_EMAIL || "support@dentwise.com";

      // send the email with improved configuration
      console.log("Calling Resend API...");
      const { data, error } = await resend!.emails.send({
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
        dataDetails: data
      });

      if (error) {
        console.error("Resend error:", error);
        return NextResponse.json(
          { error: "Failed to send email", details: error },
          { status: 500 }
        );
      }

      if (!data || !data.id) {
        console.warn("Resend returned success but no email ID. Response:", { data, error });
        return NextResponse.json(
          { 
            error: "Email may not have been sent",
            message: "Resend API returned success but no email ID was provided",
            details: { data, error }
          },
          { status: 500 }
        );
      }

      console.log("✅ Email sent successfully!");
      console.log("Email ID:", data.id);
      console.log("To:", userEmail);
      console.log("From:", fromAddress);
      console.log("Reply-To:", replyToAddress);
      
      return NextResponse.json(
        { 
          message: "Email sent successfully", 
          emailId: data.id,
          to: userEmail
        },
        { status: 200 }
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
          message: resendError?.message || "Unknown error occurred while sending email",
          name: resendError?.name || "ResendError",
          // Only include stack in development
          ...(process.env.NODE_ENV === "development" && { 
            stack: resendError?.stack,
            details: resendError 
          }),
        },
        { status: 500 }
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
            details: String(error)
          }),
        },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    } catch (responseError) {
      // Fallback if even creating the response fails
      console.error("Critical error creating error response:", responseError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Internal server error",
          message: "An unexpected error occurred"
        }),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
    }
  }
}

