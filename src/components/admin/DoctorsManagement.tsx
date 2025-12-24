"use client";

import { useDeleteDoctor, useGetDoctors } from "@/hooks/use-doctors";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  EditIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  StethoscopeIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { Doctor } from "@prisma/client";
import AddDoctorDialog from "./AddDoctorDialog";
import EditDoctorDialog from "./EditDoctorDialog";

type DoctorWithAppointmentCount = Doctor & {
  appointmentCount: number;
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";

function DoctorsManagement() {
  const { data: doctors = [] } = useGetDoctors();
  const deleteDoctorMutation = useDeleteDoctor();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorWithAppointmentCount | null>(null);

  const handleEditDoctor = (doctor: DoctorWithAppointmentCount) => {
    setSelectedDoctor(doctor);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedDoctor(null);
  };

  const handleDeleteDoctor = (doctor: DoctorWithAppointmentCount) => {
    setSelectedDoctor(doctor);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedDoctor(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedDoctor) return;

    deleteDoctorMutation.mutate(selectedDoctor.id, {
      onSuccess: (result) => {
        if (result.appointmentCount > 0) {
          toast.success(
            `Doctor deleted successfully. ${result.appointmentCount} appointment(s) were also deleted.`,
          );
        } else {
          toast.success("Doctor deleted successfully");
        }
        handleCloseDeleteDialog();
      },
      onError: (error: any) => {
        const errorMessage = error?.message || "Failed to delete doctor";
        toast.error(errorMessage);
      },
    });
  };

  return (
    <>
      <Card className="mb-12">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StethoscopeIcon className="size-5 text-primary" />
              Doctors Management
            </CardTitle>
            <CardDescription>
              Manage and oversee all doctors in your practice
            </CardDescription>
          </div>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/100"
          >
            <PlusIcon className="mr-2 size-4" />
            Add Doctor
          </Button>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={doctor.imageUrl}
                    alt={doctor.name}
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover ring-2 ring-background"
                  />

                  <div>
                    <div className="font-semibold">{doctor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {doctor.speciality}
                      <span className="ml-2 px-2 py-0.5 bg-muted rounded text-xs">
                        {doctor.gender === "MALE" ? "Male" : "Female"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MailIcon className="h-3 w-3" />
                        {doctor.email}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PhoneIcon className="h-3 w-3" />
                        {doctor.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="font-semibold text-primary">
                      {doctor.appointmentCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Appointments
                    </div>
                  </div>

                  {doctor.isActive ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3"
                    onClick={() => handleEditDoctor(doctor)}
                  >
                    <EditIcon className="size-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteDoctor(doctor)}
                  >
                    <TrashIcon className="size-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AddDoctorDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
      />

      <EditDoctorDialog
        key={selectedDoctor?.id}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        doctor={selectedDoctor}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDoctor && selectedDoctor.appointmentCount > 0 ? (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{selectedDoctor.name}</strong>? This action will also
                  delete{" "}
                  <strong>
                    {selectedDoctor.appointmentCount} appointment
                    {selectedDoctor.appointmentCount > 1 ? "s" : ""}
                  </strong>{" "}
                  associated with this doctor. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete{" "}
                  <strong>{selectedDoctor?.name}</strong>? This action cannot be
                  undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDoctorMutation.isPending}
            >
              {deleteDoctorMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DoctorsManagement;
