import { auth, currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { contactId } = params;

    // Verify user has access to this contact
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: { user: true },
    });

    if (!contact) {
      return new Response("Contact not found", { status: 404 });
    }

    // Check if user is admin or owns this contact
    const user = await prisma.user.findUnique({
      where: { clerkID: userId },
    });

    const clerkUser = await currentUser();
    const adminEmail = process.env.ADMIN_EMAIL;
    const currentUserEmail = clerkUser?.emailAddresses[0]?.emailAddress;
    const isAdmin = currentUserEmail === adminEmail;

    if (!isAdmin && user?.id !== contact.userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection message
        const sendEvent = (data: Record<string, unknown>) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        sendEvent({ type: "connected", contactId });

        // Keep connection alive with heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            sendEvent({ type: "heartbeat", timestamp: Date.now() });
          } catch (_error) {
            clearInterval(heartbeatInterval);
          }
        }, 30000); // Every 30 seconds

        // Get initial last message ID
        const lastMessage = await prisma.message.findFirst({
          where: { contactId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        let lastMessageId: string | null = lastMessage?.id || null;

        // Poll for new messages (only when connection is active)
        const pollInterval = setInterval(async () => {
          try {
            const messages = await prisma.message.findMany({
              where: {
                contactId,
                ...(lastMessageId && {
                  id: { gt: lastMessageId },
                }),
              },
              orderBy: { createdAt: "asc" },
              take: 50, // Get up to 50 new messages
            });

            if (messages.length > 0) {
              for (const message of messages) {
                sendEvent({
                  type: "new_message",
                  message: {
                    id: message.id,
                    content: message.content,
                    senderId: message.senderId,
                    isAdmin: message.isAdmin,
                    createdAt: message.createdAt.toISOString(),
                  },
                });
                lastMessageId = message.id;
              }
            }
          } catch (error) {
            console.error("Error polling messages:", error);
            // Don't close on error, just log it
          }
        }, 1500); // Poll every 1.5 seconds for better realtime feel

        // Cleanup on close
        request.signal.addEventListener("abort", () => {
          clearInterval(pollInterval);
          clearInterval(heartbeatInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
