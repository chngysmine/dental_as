"use client";

import { useUpdateDoctor } from "@/hooks/use-doctors";
import { Gender, Doctor } from "@prisma/client";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import { toast } from "sonner";

interface EditDoctorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

export default function EditDoctorDialog({ isOpen, onClose, doctor }: EditDoctorDialogProps) {
  const [editedDoctor, setEditedDoctor] = useState({
    name: "",
    email: "",
    phone: "",
    speciality: "",
    gender: "MALE" as Gender,
    isActive: true,
  });

  const updateDoctorMutation = useUpdateDoctor();

  // Pre-fill form when doctor changes
  useEffect(() => {
    if (doctor) {
      setEditedDoctor({
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        speciality: doctor.speciality || "",
        gender: doctor.gender || "MALE",
        isActive: doctor.isActive ?? true,
      });
    }
  }, [doctor]);

  const handlePhoneChange = (value: string) => {
    const formattedPhoneNumber = formatPhoneNumber(value);
    setEditedDoctor({ ...editedDoctor, phone: formattedPhoneNumber });
  };

  const handleSave = () => {
    if (!doctor) return;

    updateDoctorMutation.mutate(
      { id: doctor.id, ...editedDoctor },
      {
        onSuccess: () => {
          toast.success("Doctor updated successfully");
          handleClose();
        },
        onError: (error: any) => {
          const errorMessage = error?.message || "Failed to update doctor";
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleClose = () => {
    onClose();
    if (doctor) {
      setEditedDoctor({
        name: doctor.name || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        speciality: doctor.speciality || "",
        gender: doctor.gender || "MALE",
        isActive: doctor.isActive ?? true,
      });
    }
  };

  if (!doctor) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogDescription>Update doctor information and status.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editedDoctor.name}
                onChange={(e) => setEditedDoctor({ ...editedDoctor, name: e.target.value })}
                placeholder="Dr. Tuan Cot Dinh"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-speciality">Speciality *</Label>
              <Input
                id="edit-speciality"
                value={editedDoctor.speciality}
                onChange={(e) => setEditedDoctor({ ...editedDoctor, speciality: e.target.value })}
                placeholder="General Dentistry"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={editedDoctor.email}
              onChange={(e) => setEditedDoctor({ ...editedDoctor, email: e.target.value })}
              placeholder="doctor@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              value={editedDoctor.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="0912 345 678"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-gender">Gender</Label>
              <Select
                value={editedDoctor.gender || ""}
                onValueChange={(value) => setEditedDoctor({ ...editedDoctor, gender: value as Gender })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editedDoctor.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setEditedDoctor({ ...editedDoctor, isActive: value === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
            disabled={
              !editedDoctor.name ||
              !editedDoctor.email ||
              !editedDoctor.speciality ||
              updateDoctorMutation.isPending
            }
          >
            {updateDoctorMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

