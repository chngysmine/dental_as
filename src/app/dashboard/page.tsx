import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "../admin/AdminDashboardClient";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  try {
    const user = await currentUser();

    if (!user) redirect("/");

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // If user is admin, show admin dashboard with doctors list
    if (adminEmail && userEmail === adminEmail) {
      return <AdminDashboardClient />;
    }

    // Otherwise show regular user dashboard
    return <DashboardClient />;
  } catch (error) {
    console.error("Error in dashboard page:", error);
    redirect("/");
  }
}
