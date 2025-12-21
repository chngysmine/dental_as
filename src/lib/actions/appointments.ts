"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function getAppointments() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return appointments;
  } catch (error) {
    console.log("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

export async function getUserAppointments() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkID: userId },
    });

    if (!dbUser) {
      return [];
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: dbUser.id,
      },
      include: {
        doctor: {
          select: {
            name: true,
            imageUrl: true,
            speciality: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Filter out appointments with missing doctor data and log for debugging
    const validAppointments = appointments.filter((appointment) => {
      if (!appointment.doctor) {
        console.warn(`Appointment ${appointment.id} has no doctor relation (doctorId: ${appointment.doctorId})`);
        return false;
      }
      return true;
    });

    return validAppointments;
  } catch (error) {
    console.log("Error fetching user appointments:", error);
    throw new Error("Failed to fetch user appointments");
  }
}

export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
      select: { time: true },
    });

    return appointments.map((appointment) => appointment.time);
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    return [];
  }
}

interface BookAppointmentInput {
  doctorId: string;
  date: string;
  time: string;
  reason?: string;
}

export async function bookAppointment(input: BookAppointmentInput) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("You must be logged in to book an appointment");

    if (!input.doctorId || !input.date || !input.time) {
      throw new Error("Doctor, date, and time are required");
    }

    const user = await prisma.user.findUnique({ where: { clerkID: userId } });
    if (!user) throw new Error("User not found. Please ensure your account is properly set up.");

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        doctorId: input.doctorId,
        date: new Date(input.date),
        time: input.time,
        reason: input.reason || "General consultation",
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        doctor: { select: { name: true, imageUrl: true, speciality: true } },
      },
    });

    revalidatePath("/appointments");
    revalidatePath("/dashboard");

    return {
      ...appointment,
      patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
      patientEmail: appointment.user.email,
      doctorName: appointment.doctor.name,
      doctorImageUrl: appointment.doctor.imageUrl || "",
      doctorSpeciality: appointment.doctor.speciality || "",
      date: appointment.date.toISOString().split("T")[0],
    };
  } catch (error) {
    console.error("Error booking appointment:", error);
    throw new Error("Failed to book appointment. Please try again later.");
  }
}
