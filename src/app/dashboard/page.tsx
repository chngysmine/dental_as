import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ActivityOverview from "@/components/dashboard/ActivityOverview";
import MainActions from "@/components/dashboard/MainActions";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import Navbar from "@/components/Navbar";
import AdminDashboardClient from "../admin/AdminDashboardClient";

export default async function DashboardPage() {
  try {
    let user: Awaited<ReturnType<typeof currentUser>>;
    try {
      user = await currentUser();
    } catch (clerkError: unknown) {
      console.error("Clerk API error:", clerkError);
      // If Clerk API fails, redirect to home
      redirect("/");
      return null;
    }

    if (!user) redirect("/");

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // If user is admin, show admin dashboard with doctors list
    if (adminEmail && userEmail === adminEmail) {
      return <AdminDashboardClient />;
    }

    // Otherwise show regular user dashboard with new components
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
          <WelcomeSection />
          <MainActions />
          <ActivityOverview />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in dashboard page:", error);
    redirect("/");
  }
}
