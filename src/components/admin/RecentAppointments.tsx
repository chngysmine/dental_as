"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar } from "lucide-react";
import { useGetAppointments } from "@/hooks/use-appointments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { format } from "date-fns";
import { AppointmentStatus } from "@prisma/client";
import { updateAppointmentStatus } from "@/lib/actions/appointments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const statusOrder: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

function getNextStatus(currentStatus: AppointmentStatus): AppointmentStatus {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % statusOrder.length;
  return statusOrder[nextIndex];
}

function formatStatus(status: AppointmentStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusVariant(
  status: AppointmentStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONFIRMED":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    case "PENDING":
      return "outline";
    default:
      return "secondary";
  }
}

export default function RecentAppointments() {
  const { data: appointments = [], isLoading } = useGetAppointments();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: updateAppointmentStatus,
    onSuccess: () => {
      // Invalidate both admin and user appointment queries to force refresh
      queryClient.invalidateQueries({ queryKey: ["getAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["getUserAppointments"] });
      // Also refetch immediately to ensure data is up to date
      queryClient.refetchQueries({ queryKey: ["getAppointments"] });
      queryClient.refetchQueries({ queryKey: ["getUserAppointments"] });
      toast.success("Appointment status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleStatusClick = (
    appointmentId: string,
    currentStatus: AppointmentStatus,
  ) => {
    const newStatus = getNextStatus(currentStatus);
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(date);
      const formattedDate = format(dateObj, "M/d/yyyy");
      return `${formattedDate}, ${time}`;
    } catch {
      return `${date}, ${time}`;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Recent Appointments</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and manage all patient appointments
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No recent appointments</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment: any) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {appointment.patientName || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.patientEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{appointment.doctorName}</p>
                  </TableCell>
                  <TableCell>
                    <p>{formatDateTime(appointment.date, appointment.time)}</p>
                  </TableCell>
                  <TableCell>
                    <p>{appointment.reason || "General Consultation"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(appointment.status)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        handleStatusClick(appointment.id, appointment.status)
                      }
                    >
                      {formatStatus(appointment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      Click status to toggle
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
