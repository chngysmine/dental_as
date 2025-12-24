/**
 * Script để test email sending functionality
 * Chạy: npx tsx scripts/test-email.ts
 */

import { Resend } from "resend";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function testEmail() {
  console.log("🔍 Testing Email Configuration...\n");

  // Check RESEND_API_KEY
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not set in .env.local");
    console.log("\n📝 Cách khắc phục:");
    console.log("1. Tạo file .env.local trong thư mục gốc");
    console.log("2. Thêm dòng: RESEND_API_KEY=re_your_api_key_here");
    console.log("3. Lấy API key từ: https://resend.com/api-keys");
    process.exit(1);
  }

  console.log("✅ RESEND_API_KEY found");

  // Validate API key format
  if (!apiKey.startsWith("re_")) {
    console.error("❌ RESEND_API_KEY format is invalid. It should start with 're_'");
    process.exit(1);
  }

  if (apiKey.length < 20) {
    console.error("❌ RESEND_API_KEY appears to be too short");
    process.exit(1);
  }

  console.log("✅ RESEND_API_KEY format is valid\n");

  // Initialize Resend
  const resend = new Resend(apiKey);

  // Test email sending
  const testEmail = process.env.TEST_EMAIL || "test@example.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "DentWise <onboarding@resend.dev>";

  console.log("📧 Attempting to send test email...");
  console.log(`   From: ${fromEmail}`);
  console.log(`   To: ${testEmail}\n`);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [testEmail],
      subject: "Test Email from DentWise",
      html: "<h1>Test Email</h1><p>This is a test email from DentWise application.</p>",
      text: "Test Email\n\nThis is a test email from DentWise application.",
    });

    if (error) {
      console.error("❌ Error sending email:", error);
      process.exit(1);
    }

    if (!data || !data.id) {
      console.error("❌ Email may not have been sent - no ID returned");
      process.exit(1);
    }

    console.log("✅ Email sent successfully!");
    console.log(`   Email ID: ${data.id}`);
    console.log("\n💡 Tips:");
    console.log("- Kiểm tra inbox và spam folder");
    console.log("- Nếu dùng onboarding@resend.dev, email có thể bị chặn bởi Gmail");
    console.log("- Để tránh spam, nên verify domain trong Resend dashboard");
    console.log("- Xem logs tại: https://resend.com/emails");
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);
    console.error("   Details:", error);
    process.exit(1);
  }
}

testEmail();

