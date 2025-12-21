"use client";

import { bookAppointment, getBookedTimeSlots, getUserAppointments } from "@/lib/actions/appointments";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useUserAppointments() {
  return useQuery({
    queryKey: ["getUserAppointments"],
    queryFn: getUserAppointments,
  });
}

export function useBookAppointment() {
  return useMutation({
    mutationFn: bookAppointment,
  });
}

export function useBookedTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ["getBookedTimeSlots", doctorId, date],
    queryFn: () => getBookedTimeSlots(doctorId, date),
    enabled: !!doctorId && !!date,
  });
}

