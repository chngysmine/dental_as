import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn(
    "⚠️ RESEND_API_KEY is not configured. Email functionality will not work.",
  );
} else {
  // Validate API key format
  if (!apiKey.startsWith("re_")) {
    console.error(
      "❌ RESEND_API_KEY format is invalid. It should start with 're_'",
    );
  } else if (apiKey.length < 20) {
    console.error(
      "❌ RESEND_API_KEY appears to be too short. Please verify it's correct.",
    );
  } else {
    console.log("✅ RESEND_API_KEY format looks valid");
  }
}

// Only create Resend instance if API key exists and appears valid
const resend: Resend | null =
  apiKey && apiKey.startsWith("re_") ? new Resend(apiKey) : null;

export default resend;
