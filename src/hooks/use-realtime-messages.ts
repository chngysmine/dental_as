"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

export function useRealtimeMessages(contactId: string | null) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!contactId || !user) return;

    // Create SSE connection
    const eventSource = new EventSource(`/api/contacts/${contactId}/events`, {
      // Add user email to headers via query param (SSE doesn't support custom headers)
      // We'll handle auth in the endpoint
    });

    eventSource.onopen = () => {
      console.log("SSE connection opened for contact:", contactId);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "new_message") {
          // Update the messages query cache
          queryClient.setQueryData(
            ["getContactMessages", contactId],
            (oldMessages: any[] = []) => {
              // Remove any temp messages
              const filteredMessages = oldMessages.filter(
                (msg: any) => !msg.id.startsWith("temp-"),
              );

              // Check if message already exists
              const exists = filteredMessages.some(
                (msg: any) => msg.id === data.message.id,
              );
              if (exists) return filteredMessages;

              // Add new message and sort by createdAt
              const newMessages = [...filteredMessages, data.message];
              return newMessages.sort((a, b) => {
                const aTime = new Date(a.createdAt).getTime();
                const bTime = new Date(b.createdAt).getTime();
                return aTime - bTime;
              });
            },
          );

          // Invalidate contacts list to update latest message (debounced)
          queryClient.invalidateQueries({
            queryKey: ["getContacts"],
            exact: false,
          });
        } else if (data.type === "heartbeat") {
          // Just keep connection alive, no action needed
        } else if (data.type === "connected") {
          console.log("SSE connected to contact:", data.contactId);
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      // EventSource will automatically reconnect
    };

    eventSourceRef.current = eventSource;

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [contactId, user, queryClient]);

  return eventSourceRef.current;
}
