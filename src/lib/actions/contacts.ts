"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

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

// Get all contacts for admin (with latest message info)
export async function getContacts() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        user: {
          select: {
            id: true,
            clerkID: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return contacts.map((contact) => ({
      id: contact.id,
      userId: contact.userId,
      userEmail: contact.user.email,
      userName:
        `${contact.user.firstName || ""} ${contact.user.lastName || ""}`.trim() ||
        contact.user.email,
      latestMessage: contact.messages[0]?.content || null,
      latestMessageTime: contact.messages[0]?.createdAt || null,
      messageCount: contact._count.messages,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    }));
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    if (isDatabaseConnectionError(error)) {
      console.error("Database connection error - returning empty array");
      return [];
    }
    return [];
  }
}

// Get messages for a specific contact
export async function getContactMessages(contactId: string) {
  try {
    const messages = await prisma.message.findMany({
      where: { contactId },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt,
    }));
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    if (isDatabaseConnectionError(error)) {
      console.error("Database connection error - returning empty array");
      return [];
    }
    return [];
  }
}

// Get or create contact for current user
export async function getOrCreateUserContact() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("You must be logged in");
    }

    let user = await prisma.user.findUnique({ where: { clerkID: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Find existing contact or create new one
    let contact = await prisma.contact.findFirst({
      where: { userId: user.id },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: { userId: user.id },
      });
    }

    return contact.id;
  } catch (error: any) {
    console.error("Error getting/creating contact:", error);
    throw new Error("Failed to get or create contact");
  }
}

// Send a message (from user or admin)
export async function sendMessage(input: {
  contactId: string;
  content: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("You must be logged in");
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new Error("Message content is required");
    }

    // Check if user is admin
    const user = await currentUser();
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = user?.emailAddresses[0]?.emailAddress === adminEmail;

    const message = await prisma.message.create({
      data: {
        contactId: input.contactId,
        content: input.content.trim(),
        senderId: userId,
        isAdmin: isAdmin, // Server determines if user is admin
      },
    });

    // Update contact's updatedAt
    await prisma.contact.update({
      where: { id: input.contactId },
      data: { updatedAt: new Date() },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt,
    };
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (isDatabaseConnectionError(error)) {
      throw new Error("Database connection error. Please try again later.");
    }
    throw new Error(error.message || "Failed to send message");
  }
}
