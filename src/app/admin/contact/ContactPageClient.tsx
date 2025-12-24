"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useGetContacts } from "@/hooks/use-contacts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ChatDialog from "@/components/admin/ChatDialog";
import { MessageSquare, Loader2 } from "lucide-react";

type Contact = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  latestMessage: string | null;
  latestMessageTime: Date | string | null;
  messageCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export default function ContactPageClient() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const { data: contacts = [], isLoading } = useGetContacts();

  const selectedContact = contacts.find(
    (c: Contact) => c.id === selectedContactId,
  );

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const hours = Math.floor(
        (Date.now() - dateObj.getTime()) / (1000 * 60 * 60),
      );
      if (hours < 1) {
        const minutes = Math.floor(
          (Date.now() - dateObj.getTime()) / (1000 * 60),
        );
        return minutes <= 0 ? "Vừa xong" : `${minutes} phút`;
      }
      if (hours < 24) {
        return `${hours} giờ`;
      }
      const days = Math.floor(hours / 24);
      return `${days} ngày`;
    } catch {
      return "";
    }
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setChatDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
            <p className="text-muted-foreground">
              Danh sách tin nhắn từ người dùng
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">
                Chưa có tin nhắn nào
              </p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Các tin nhắn từ người dùng sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-0 bg-card dark:bg-gray-900 rounded-lg border border-border/50 overflow-hidden">
              {contacts.map((contact: Contact) => (
                <div
                  key={contact.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleContactSelect(contact.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleContactSelect(contact.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors border-b border-border/50 last:border-b-0",
                    "hover:bg-accent/50 dark:hover:bg-gray-800/50",
                    selectedContactId === contact.id &&
                      "bg-accent dark:bg-gray-800",
                  )}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/20 text-primary dark:bg-primary/30">
                      {getInitials(contact.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-medium text-base truncate text-foreground">
                        {contact.userName}
                      </p>
                      {contact.latestMessageTime && (
                        <p className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatTime(contact.latestMessageTime)}
                        </p>
                      )}
                    </div>
                    {contact.latestMessage ? (
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.latestMessage}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/70 italic">
                        Chưa có tin nhắn
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      className="p-1.5 rounded-full hover:bg-accent dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Menu options có thể thêm sau
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="More options"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedContact && (
        <ChatDialog
          contactId={selectedContact.id}
          userName={selectedContact.userName}
          userEmail={selectedContact.userEmail}
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          isAdminView={true}
        />
      )}
    </div>
  );
}
