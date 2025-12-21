"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";

export async function syncUser() {
  try {
    let user;
    try {
      user = await currentUser();
    } catch (clerkError: any) {
      console.error("Clerk API error:", clerkError);
      // If Clerk API fails, return null instead of throwing
      return null;
    }

    if (!user) {
      console.log("No user found");
      return null;
    }

    const existingUser = await prisma.user.findUnique({
      where: { clerkID: user.id },
    });
    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      return existingUser;
    }

    // Validate email
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) {
      console.error("User has no email address");
      throw new Error("User email is required");
    }

    const dbUser = await prisma.user.create({
      data: {
        clerkID: user.id,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        email: email,
        phone: user.phoneNumbers?.[0]?.phoneNumber || null,
      },
    });

    console.log("User created successfully:", dbUser.id);
    return dbUser;
  } catch (error) {
    console.error("Error syncing user:", error);
    throw error;
  }
}
