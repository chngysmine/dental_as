import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ContactPageClient from "./ContactPageClient";

export default async function ContactPage() {
  try {
    let user: Awaited<ReturnType<typeof currentUser>>;
    try {
      user = await currentUser();
    } catch (clerkError: unknown) {
      console.error("Clerk API error:", clerkError);
      redirect("/");
      return null;
    }

    if (!user) redirect("/");

    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!adminEmail || userEmail !== adminEmail) redirect("/dashboard");

    return <ContactPageClient />;
  } catch (error) {
    console.error("Error in contact page:", error);
    redirect("/");
  }
}
