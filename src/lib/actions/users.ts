"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";

export async function syncUser() {
  try {
    let user;
    try {
      user = await currentUser();
    } catch (clerkError: any) {
      // Log as warning in development, silent in production
      if (process.env.NODE_ENV === "development") {
        console.warn("Clerk API error (handled gracefully):", {
          code: clerkError?.code,
          message: clerkError?.message || "Unknown error",
          status: clerkError?.status,
        });
      }
      // If Clerk API fails, return null instead of throwing
      return null;
    }
    
    if (!user) {
      console.log("No user found");
      return null;
    }

    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
      where: { clerkID: user.id },
    });
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      // If database is unreachable, return null instead of crashing
      return null;
    }

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

    let dbUser;
    try {
      dbUser = await prisma.user.create({
      data: {
        clerkID: user.id,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        email: email,
        phone: user.phoneNumbers?.[0]?.phoneNumber || null,
      },
    });
    console.log("User created successfully:", dbUser.id);
    } catch (dbError: any) {
      console.error("Database error creating user:", dbError);
      // If database is unreachable, return null instead of crashing
      return null;
    }
    
    return dbUser;
  } catch (error) {
    console.error("Error syncing user:", error);
    // Don't throw - return null to prevent app crashes
    return null;
  }
}

