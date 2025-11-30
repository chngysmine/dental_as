"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";

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
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return [];
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkID: clerkUser.id },
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

    return appointments;
  } catch (error) {
    console.log("Error fetching user appointments:", error);
    throw new Error("Failed to fetch user appointments");
  }
}

