"use client";

import Navbar from "../../components/Navbar";
import { useUser } from "@clerk/nextjs";
import { CalendarIcon, ClockIcon, CheckCircleIcon } from "lucide-react";
import { useGetUserAppointments } from "../../hooks/use-appointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

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

function DashboardClient() {
  const { user } = useUser();
  const { data: appointments = [], isLoading: appointmentsLoading, error: appointmentsError } = useGetUserAppointments();

  // Calculate stats
  const now = new Date();
  const upcomingAppointments = appointments.filter((app) => {
    const appointmentDate = new Date(app.date);
    return appointmentDate >= now && app.status !== "CANCELLED";
  });
  const completedAppointments = appointments.filter((app) => app.status === "COMPLETED");
  const pendingAppointments = appointments.filter((app) => app.status === "PENDING");

  const stats = {
    total: appointments.length,
    upcoming: upcomingAppointments.length,
    completed: completedAppointments.length,
    pending: pendingAppointments.length,
  };

  if (appointmentsLoading) {
    return <LoadingUI />;
  }

  if (appointmentsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading data</p>
          <p className="text-sm text-muted-foreground">
            {appointmentsError?.message || "Please try refreshing the page"}
          </p>
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* WELCOME SECTION */}
        <div className="mb-12 flex items-center justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-3xl p-8 border border-primary/20">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-primary">Dashboard</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user?.firstName || "User"}!
              </h1>
              <p className="text-muted-foreground">
                View your appointments, manage your schedule, and stay connected with your dental care.
              </p>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-16 h-16 text-primary" />
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <CardDescription className="text-xs mt-1">All time appointments</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <ClockIcon className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.upcoming}</div>
              <CardDescription className="text-xs mt-1">Scheduled appointments</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
              <CardDescription className="text-xs mt-1">Finished appointments</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <ClockIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
              <CardDescription className="text-xs mt-1">Awaiting confirmation</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* RECENT APPOINTMENTS */}
        <Card>
          <CardHeader>
            <CardTitle>Your Appointments</CardTitle>
            <CardDescription>View and manage your upcoming and past appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Book your first appointment to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{appointment.doctor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.doctor.speciality}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(appointment.date)} at {appointment.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          appointment.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "PENDING"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardClient;




