import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Gender } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatar(name: string, _gender: Gender): string {
  // Use UI Avatars service to generate avatar based on name
  const encodedName = encodeURIComponent(name);

  // UI Avatars API - generates avatar with initials
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=200&bold=true`;
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  let phoneNumber = value.replace(/\D/g, "");

  // Remove country code if present (84 or +84)
  if (phoneNumber.startsWith("84") && phoneNumber.length > 10) {
    phoneNumber = "0" + phoneNumber.slice(2);
  }

  // Format Vietnamese phone number: 0XXX XXX XXX
  if (phoneNumber.length === 0) {
    return "";
  }
  if (phoneNumber.length <= 4) {
    return phoneNumber;
  }
  if (phoneNumber.length <= 7) {
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
  }
  return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 10)}`;
}

// Appointment types configuration
export const APPOINTMENT_TYPES = [
  {
    id: "consultation",
    name: "General Consultation",
    duration: "30 minutes",
    price: "$50",
  },
  {
    id: "cleaning",
    name: "Teeth Cleaning",
    duration: "45 minutes",
    price: "$75",
  },
  {
    id: "checkup",
    name: "Routine Checkup",
    duration: "30 minutes",
    price: "$60",
  },
  {
    id: "emergency",
    name: "Emergency Visit",
    duration: "60 minutes",
    price: "$120",
  },
];

// Get available time slots
export function getAvailableTimeSlots(): string[] {
  const slots: string[] = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM

  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  return slots;
}

// Get next 5 days as date strings (YYYY-MM-DD format)
export function getNext5Days(): string[] {
  const days: string[] = [];
  const today = new Date();

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    days.push(dateString);
  }

  return days;
}
