"use client";

import {
  getContacts,
  getContactMessages,
  getOrCreateUserContact,
  sendMessage,
} from "@/lib/actions/contacts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

export function useGetContacts() {
  const result = useQuery({
    queryKey: ["getContacts"],
    queryFn: getContacts,
  });

  return result;
}

export function useGetContactMessages(contactId: string | null) {
  const result = useQuery({
    queryKey: ["getContactMessages", contactId],
    queryFn: () => {
      if (!contactId) return [];
      return getContactMessages(contactId);
    },
    enabled: !!contactId,
  });

  return result;
}

export function useGetOrCreateUserContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getOrCreateUserContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getContacts"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { userId } = useUser();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["getContactMessages", variables.contactId],
      });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData([
        "getContactMessages",
        variables.contactId,
      ]);

      // Optimistically update with temporary message
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content: variables.content,
        senderId: userId || "",
        isAdmin: false, // Will be corrected by server
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["getContactMessages", variables.contactId],
        (old: any[] = []) => [...old, tempMessage],
      );

      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ["getContactMessages", variables.contactId],
          context.previousMessages,
        );
      }
    },
    onSuccess: (data, variables) => {
      // Remove temp message and add real one (SSE will handle this, but we do it here too for immediate update)
      queryClient.setQueryData(
        ["getContactMessages", variables.contactId],
        (old: any[] = []) => {
          // Remove temp messages
          const filtered = old.filter(
            (msg: any) => !msg.id.startsWith("temp-"),
          );
          // Check if real message already exists (from SSE)
          const exists = filtered.some((msg: any) => msg.id === data.id);
          if (exists) return filtered;
          // Add real message
          return [...filtered, data];
        },
      );
      queryClient.invalidateQueries({ queryKey: ["getContacts"] });
    },
  });
}
