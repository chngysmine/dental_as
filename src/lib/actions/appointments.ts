"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { AppointmentStatus } from "@prisma/client";

// Helper function to check if error is a database connection error
function isDatabaseConnectionError(error: any): boolean {
  return (
    error?.code === "P1001" ||
    error?.message?.includes("Can't reach database server") ||
    error?.message?.includes("connect ECONNREFUSED") ||
    error?.message?.includes("timeout") ||
    error?.message?.includes("Connection pool timeout")
  );
}

function transformAppointment(appointment: any) {
  return {
    ...appointment,
    patientName: `${appointment.user.firstName || ""} ${appointment.user.lastName || ""}`.trim(),
    patientEmail: appointment.user.email,
    doctorName: appointment.doctor.name,
    doctorImageUrl: appointment.doctor.imageUrl || "",
    date: appointment.date instanceof Date 
      ? appointment.date.toISOString().split("T")[0] 
      : appointment.date,
  };
}

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
        doctor: { select: { name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return appointments.map(transformAppointment);
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    // If database connection fails, return empty array instead of throwing
    if (isDatabaseConnectionError(error)) {
      console.error("Database connection error - returning empty array");
      return [];
    }
    // For other errors, still return empty array to prevent app crash
    console.error("Unexpected error fetching appointments, returning empty array");
    return [];
  }
}

export async function getUserAppointments() {
  try {
    // get authenticated user from Clerk
    const { userId } = await auth();
    if (!userId) {
      console.warn("No user ID found in auth");
      return [];
    }

    // find user by clerkID from authenticated session
    let user;
    try {
      user = await prisma.user.findUnique({ where: { clerkID: userId } });
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      return [];
    }

    if (!user) {
      console.warn("User not found for clerkID:", userId);
      return [];
    }

    let appointments;
    try {
      appointments = await prisma.appointment.findMany({
        where: { userId: user.id },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          doctor: { 
            select: { 
              name: true, 
              imageUrl: true,
              speciality: true,
              email: true,
              phone: true,
            } 
          },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      });
    } catch (dbError: any) {
      // Handle database connection errors
      if (isDatabaseConnectionError(dbError)) {
        console.error("Database connection error - server unreachable:", dbError.message);
        return [];
      }
      console.error("Database error fetching appointments:", dbError);
      return [];
    }

    return appointments.map(transformAppointment);
  } catch (error: any) {
    console.error("Error fetching user appointments:", error);
    // If database connection fails, return empty array instead of throwing
    if (isDatabaseConnectionError(error)) {
      console.error("Database connection error - returning empty array");
      return [];
    }
    return [];
  }
}

export async function getUserAppointmentStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { totalAppointments: 0, completedAppointments: 0 };
    }

    let user;
    try {
      user = await prisma.user.findUnique({ where: { clerkID: userId } });
    } catch (dbError: any) {
      // Handle database connection errors
      if (isDatabaseConnectionError(dbError)) {
        console.error("Database connection error - server unreachable:", dbError.message);
        return { totalAppointments: 0, completedAppointments: 0 };
      }
      console.error("Database error finding user:", dbError);
      return { totalAppointments: 0, completedAppointments: 0 };
    }

    if (!user) {
      return { totalAppointments: 0, completedAppointments: 0 };
    }

    // these calls will run in parallel, instead of waiting each other
    let totalCount, completedCount;
    try {
      [totalCount, completedCount] = await Promise.all([
        prisma.appointment.count({
          where: { userId: user.id },
        }),
        prisma.appointment.count({
          where: {
            userId: user.id,
            status: "COMPLETED",
          },
        }),
      ]);
    } catch (dbError: any) {
      // Handle database connection errors
      if (isDatabaseConnectionError(dbError)) {
        console.error("Database connection error - server unreachable:", dbError.message);
        return { totalAppointments: 0, completedAppointments: 0 };
      }
      console.error("Database error fetching stats:", dbError);
      return { totalAppointments: 0, completedAppointments: 0 };
    }

    return {
      totalAppointments: totalCount,
      completedAppointments: completedCount,
    };
  } catch (error: any) {
    // Handle any other errors including PrismaClientKnownRequestError
    if (isDatabaseConnectionError(error)) {
      console.error("Database connection error - server unreachable:", error.message);
      return { totalAppointments: 0, completedAppointments: 0 };
    }
    console.error("Error fetching user appointment stats:", error);
    return { totalAppointments: 0, completedAppointments: 0 };
  }
}

export async function getBookedTimeSlots(doctorId: string, date: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date: new Date(date),
        status: {
          in: ["CONFIRMED", "COMPLETED"], // consider both confirmed and completed appointments as blocking
        },
      },
      select: { time: true },
    });

    return appointments.map((appointment) => appointment.time);
  } catch (error: any) {
    // Handle database connection errors
    if (error?.code === "P1001" || 
        error?.message?.includes("Can't reach database server") ||
        error?.message?.includes("connect ECONNREFUSED") ||
        error?.message?.includes("timeout")) {
      console.error("Database connection error - server unreachable:", error.message);
      return []; // return empty array if database is unreachable
    }
    console.error("Error fetching booked time slots:", error);
    return []; // return empty array if there's an error
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

    let user;
    try {
      user = await prisma.user.findUnique({ where: { clerkID: userId } });
    } catch (dbError: any) {
      // Handle database connection errors
      if (isDatabaseConnectionError(dbError)) {
        console.error("Database connection error - server unreachable:", dbError.message);
        throw new Error("Database connection error. Please try again later.");
      }
      console.error("Database connection error:", dbError);
      throw new Error("Database connection error. Please try again later.");
    }

    if (!user) throw new Error("User not found. Please ensure your account is properly set up.");

    let appointment;
    try {
      appointment = await prisma.appointment.create({
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
          doctor: { select: { name: true, imageUrl: true } },
        },
      });
    } catch (dbError: any) {
      // Handle database connection errors
      if (isDatabaseConnectionError(dbError)) {
        console.error("Database connection error - server unreachable:", dbError.message);
        throw new Error("Database connection error. Please try again later.");
      }
      console.error("Database error creating appointment:", dbError);
      throw new Error("Failed to create appointment. Please try again later.");
    }

    return transformAppointment(appointment);
  } catch (error: any) {
    console.error("Error booking appointment:", error);
    if (error.message) {
      throw error;
    }
    throw new Error("Failed to book appointment. Please try again later.");
  }
}

export async function updateAppointmentStatus(input: { id: string; status: AppointmentStatus }) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    return appointment;
  } catch (error: any) {
    // Handle database connection errors
    if (error?.code === "P1001" || 
        error?.message?.includes("Can't reach database server") ||
        error?.message?.includes("connect ECONNREFUSED") ||
        error?.message?.includes("timeout")) {
      console.error("Database connection error - server unreachable:", error.message);
      throw new Error("Database connection error. Please try again later.");
    }
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }
}

