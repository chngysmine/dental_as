"use client";

import { useUser } from "@clerk/nextjs";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import ChatDialog from "@/components/admin/ChatDialog";
import ContactList from "@/components/admin/ContactList";
import DoctorsManagement from "@/components/admin/DoctorsManagement";
import RecentAppointments from "@/components/admin/RecentAppointments";
import { useGetContacts } from "@/hooks/use-contacts";
import AdminStats from "../../components/admin/AdminStats";
import Navbar from "../../components/Navbar";
import { useGetAppointments } from "../../hooks/use-appointments";
import { useGetDoctors } from "../../hooks/use-doctors";

function LoadingUI() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type AppointmentWithRelations = {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string | null;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  doctorImageUrl: string;
  patientEmail: string;
  patientName: string;
};

function AdminDashboardClient() {
  const { user } = useUser();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const {
    data: doctors = [],
    isLoading: doctorsLoading,
    error: doctorsError,
  } = useGetDoctors();
  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useGetAppointments();
  const { data: contacts = [] } = useGetContacts();

  // Type assertion for appointments
  const typedAppointments = appointments as AppointmentWithRelations[];

  // calculate stats
  const stats = {
    totalDoctors: doctors.length,
    activeDoctors: doctors.filter((doc) => doc.isActive).length,
    totalAppointments: typedAppointments.length,
    completedAppointments: typedAppointments.filter(
      (app) => app.status === "COMPLETED",
    ).length,
  };

  // Get selected contact info
  type Contact = {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    latestMessage: string | null;
    latestMessageTime: Date | string | null;
    messageCount: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  const selectedContact = contacts.find(
    (c: Contact) => c.id === selectedContactId,
  );

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setChatDialogOpen(true);
  };

  if (doctorsLoading || appointmentsLoading) {
    return <LoadingUI />;
  }

  if (doctorsError || appointmentsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading data</p>
          <p className="text-sm text-muted-foreground">
            {doctorsError?.message ||
              appointmentsError?.message ||
              "Please try refreshing the page"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* ADMIN WELCOME SECTION */}
        <div className="mb-12 flex items-center justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl p-8 border border-primary/20">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-primary">
                Admin Dashboard
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user?.firstName || "Admin"}!
              </h1>
              <p className="text-muted-foreground">
                Manage doctors, oversee appointments, and monitor your dental
                practice performance.
              </p>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <SettingsIcon className="w-16 h-16 text-primary" />
            </div>
          </div>
        </div>

        <AdminStats
          totalDoctors={stats.totalDoctors}
          activeDoctors={stats.activeDoctors}
          totalAppointments={stats.totalAppointments}
          completedAppointments={stats.completedAppointments}
        />
        <div className="mt-8">
          <RecentAppointments />
        </div>
        <div className="mt-8">
          <DoctorsManagement />
        </div>
        <div className="mt-8">
          <ContactList
            selectedContactId={selectedContactId}
            onContactSelect={handleContactSelect}
          />
        </div>
      </div>

      {selectedContact && (
        <ChatDialog
          contactId={selectedContact.id}
          userName={selectedContact.userName}
          userEmail={selectedContact.userEmail}
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          isAdminView={true}
        />
      )}
    </div>
  );
}

export default AdminDashboardClient;
