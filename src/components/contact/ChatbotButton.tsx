"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { MessageCircle, X } from "lucide-react";
import ChatDialog from "../admin/ChatDialog";
import { useGetOrCreateUserContact } from "@/hooks/use-contacts";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const { user } = useUser();
  const getOrCreateContact = useGetOrCreateUserContact();

  const handleOpen = async () => {
    try {
      const id = await getOrCreateContact.mutateAsync();
      setContactId(id);
      setOpen(true);
    } catch (error) {
      toast.error("Failed to open chat. Please try again.");
      console.error("Failed to get/create contact:", error);
    }
  };

  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.emailAddresses[0]?.emailAddress ||
      "User"
    : "User";
  const userEmail = user?.emailAddresses[0]?.emailAddress || "";

  return (
    <>
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-primary hover:bg-primary/90"
        size="icon"
        aria-label="Open chat"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>

      {contactId && (
        <ChatDialog
          contactId={contactId}
          userName={userName}
          userEmail={userEmail}
          open={open}
          onOpenChange={setOpen}
          isAdminView={false}
        />
      )}
    </>
  );
}
