import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  try {
    let user;
    try {
      user = await currentUser();
    } catch (clerkError: any) {
      console.error("Clerk API error:", clerkError);
      // If Clerk API fails, redirect to home
      redirect("/");
      return null;
    }

    if (!user) redirect("/");

    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!adminEmail || userEmail !== adminEmail) redirect("/dashboard");

    return <AdminDashboardClient />;
  } catch (error) {
    console.error("Error in admin page:", error);
    redirect("/");
  }
}

