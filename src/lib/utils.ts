import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Gender } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAvatar(name: string, gender: Gender): string {
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
  } else if (phoneNumber.length <= 4) {
    return phoneNumber;
  } else if (phoneNumber.length <= 7) {
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
  } else {
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 10)}`;
  }
}
