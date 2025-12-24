"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Send, Loader2 } from "lucide-react";
import { useGetContactMessages, useSendMessage } from "@/hooks/use-contacts";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  senderId: string;
  isAdmin: boolean;
  createdAt: Date | string;
};

interface ChatDialogProps {
  contactId: string | null;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdminView?: boolean; // If true, shows admin UI, otherwise shows user UI
}

export default function ChatDialog({
  contactId,
  userName,
  userEmail,
  open,
  onOpenChange,
  isAdminView = false,
}: ChatDialogProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading } = useGetContactMessages(contactId);
  const sendMessageMutation = useSendMessage();

  // Subscribe to realtime messages via SSE only when dialog is open
  useRealtimeMessages(open && contactId ? contactId : null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!contactId || !message.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        contactId,
        content: message,
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return format(dateObj, "HH:mm");
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full h-screen sm:h-[80vh] max-h-screen sm:max-h-[90vh] flex flex-col p-0 dark bg-gray-900 border-gray-800 m-0 sm:m-4 rounded-none sm:rounded-lg overflow-hidden fixed top-0 left-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] translate-x-0 translate-y-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 shrink-0">
          <DialogTitle className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm sm:text-base truncate">
                {isAdminView ? userName : "Admin"}
              </p>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {isAdminView ? userEmail : "admin@dentwise.com"}
              </p>
            </div>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/20 text-primary dark:bg-primary/30">
                {isAdminView ? getInitials(userName) : "AD"}
              </AvatarFallback>
            </Avatar>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 px-3 sm:px-6 py-3 sm:py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: Message) => {
                // Determine if message should be right-aligned
                // When admin views: admin messages on right, user messages on left
                // When user views: user messages on right, admin messages on left
                const isRightAligned =
                  (isAdminView && msg.isAdmin) ||
                  (!isAdminView && !msg.isAdmin);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isRightAligned ? "justify-end" : "justify-start",
                    )}
                  >
                    {!isRightAligned && (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/20 text-primary dark:bg-primary/30 text-xs">
                          {msg.isAdmin ? "AD" : getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "flex flex-col gap-1 max-w-[85%] sm:max-w-[70%] min-w-0",
                        isRightAligned ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 sm:px-4 py-2 w-full",
                          isRightAligned
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-800 text-gray-100",
                        )}
                      >
                        <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 px-1">
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                    {isRightAligned && (
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/20 text-primary dark:bg-primary/30 text-xs">
                          {msg.isAdmin ? "AD" : getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-800 shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[50px] sm:min-h-[60px] max-h-[120px] resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-primary text-sm sm:text-base flex-1"
              disabled={sendMessageMutation.isPending}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="shrink-0 h-[50px] sm:h-[60px] w-[50px] sm:w-[60px] p-0"
              size="icon"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
