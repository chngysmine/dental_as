"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { MessageSquare, User } from "lucide-react";
import { useGetContacts } from "@/hooks/use-contacts";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";

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

interface ContactListProps {
  selectedContactId: string | null;
  onContactSelect: (contactId: string) => void;
}

export default function ContactList({
  selectedContactId,
  onContactSelect,
}: ContactListProps) {
  const { data: contacts = [], isLoading } = useGetContacts();

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
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Contact Messages
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Select a user to view and respond to their messages
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-2 pr-4">
              {contacts.map((contact: Contact) => (
                <div
                  key={contact.id}
                  onClick={() => onContactSelect(contact.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
                    selectedContactId === contact.id &&
                      "bg-accent border-primary/50",
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(contact.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {contact.userName}
                      </p>
                      {contact.messageCount > 0 && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {contact.messageCount}
                        </Badge>
                      )}
                    </div>
                    {contact.latestMessage && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {contact.latestMessage}
                      </p>
                    )}
                    {contact.latestMessageTime && (
                      <p className="text-xs text-muted-foreground">
                        {formatTime(contact.latestMessageTime)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
