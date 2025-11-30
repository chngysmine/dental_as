import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminPage() {
  try {
    const user = await currentUser();

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

