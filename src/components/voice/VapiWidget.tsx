"use client";

import Vapi from "@vapi-ai/web";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

function VapiWidget() {
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [callEnded, setCallEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vapiClient, setVapiClient] = useState<any>(null);

  const { user, isLoaded } = useUser();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Initialize VAPI client when component mounts
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      console.error("VAPI: API key not found in environment variables");
      setError("VAPI API key chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_VAPI_API_KEY vào .env.local");
      return;
    }

    try {
      console.log("VAPI: Initializing client in component");
      const client = new Vapi(apiKey);
      console.log("VAPI: Client created successfully", client);
      setVapiClient(client);
    } catch (err) {
      console.error("VAPI: Failed to create client:", err);
      setError("Không thể khởi tạo VAPI client. Vui lòng kiểm tra API key.");
    }
  }, []);

  // auto-scroll for messages
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // setup event listeners for VAPI
  useEffect(() => {
    if (!vapiClient) return;

    const handleCallStart = () => {
      console.log("Call started");
      setConnecting(false);
      setCallActive(true);
      setCallEnded(false);
      setError(null);
    };

    const handleCallEnd = () => {
      console.log("Call ended");
      setCallActive(false);
      setConnecting(false);
      setIsSpeaking(false);
      setCallEnded(true);
    };

    const handleSpeechStart = () => {
      console.log("AI started Speaking");
      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      console.log("AI stopped Speaking");
      setIsSpeaking(false);
    };

    const handleMessage = (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { content: message.transcript, role: message.role };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const handleError = (error: any) => {
      // Log full error details for debugging
      console.error("Vapi Error:", error);
      console.error("Error stringified:", JSON.stringify(error, null, 2));
      
      // Extract error information from VAPI error structure
      const errorMessage = error?.error?.message?.message || error?.error?.error?.message || error?.error?.message || error?.message;
      const statusCode = error?.error?.message?.statusCode || error?.error?.error?.statusCode || error?.statusCode || error?.status;
      const errorType = error?.error?.error?.error || error?.error?.error || error?.type;
      
      console.error("Extracted error info:", { errorMessage, statusCode, errorType });
      
      if (statusCode === 403 || errorType === "Forbidden") {
        // Check if it's an assistant permission issue
        if (errorMessage && errorMessage.includes("doesn't allow assistantId")) {
          const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
          const errorMsg = `API key không có quyền truy cập Assistant này. Vui lòng kiểm tra trong VAPI Dashboard (https://dashboard.vapi.ai): 1) Đảm bảo API key có quyền truy cập Assistant ID: ${assistantId} 2) Hoặc tạo API key mới với quyền truy cập Assistant này 3) Hoặc sử dụng Assistant ID khác mà API key có quyền truy cập`;
          console.error("VAPI 403: API key doesn't have permission for this Assistant ID");
          setError(errorMsg);
        } else {
          const errorMsg = "Lỗi 403: API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra NEXT_PUBLIC_VAPI_API_KEY trong .env.local";
          console.error("VAPI 403 Forbidden - API key may be invalid or expired");
          setError(errorMsg);
        }
      } else if (errorMessage) {
        setError(`Lỗi kết nối: ${errorMessage}`);
      } else if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        setError("Không thể kết nối với VAPI. Vui lòng kiểm tra API key và Assistant ID, sau đó khởi động lại server.");
      } else {
        setError("Không thể kết nối cuộc gọi. Vui lòng thử lại.");
      }
      setConnecting(false);
      setCallActive(false);
    };

    vapiClient
      .on("call-start", handleCallStart)
      .on("call-end", handleCallEnd)
      .on("speech-start", handleSpeechStart)
      .on("speech-end", handleSpeechEnd)
      .on("message", handleMessage)
      .on("error", handleError);

    // cleanup event listeners on unmount
    return () => {
      if (vapiClient) {
        vapiClient
          .off("call-start", handleCallStart)
          .off("call-end", handleCallEnd)
          .off("speech-start", handleSpeechStart)
          .off("speech-end", handleSpeechEnd)
          .off("message", handleMessage)
          .off("error", handleError);
      }
    };
  }, [vapiClient]);

  const toggleCall = async () => {
    if (callActive) {
      if (vapiClient) {
        vapiClient.stop();
      }
      setError(null);
      return;
    }

    try {
      setError(null);
      setConnecting(true);
      setMessages([]);
      setCallEnded(false);

      // Check if VAPI client is initialized
      if (!vapiClient) {
        const errorMsg = "VAPI client chưa được khởi tạo. Vui lòng đợi một chút và thử lại.";
        console.error("VAPI client not initialized");
        setError(errorMsg);
        setConnecting(false);
        return;
      }

      // Check if API key and Assistant ID are configured
      const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      console.log("VAPI: Starting call with:", {
        hasApiKey: !!apiKey,
        apiKeyPreview: apiKey ? apiKey.substring(0, 8) + "..." : "missing",
        hasAssistantId: !!assistantId,
        assistantId: assistantId,
        hasVapiClient: !!vapiClient,
        vapiClientType: typeof vapiClient,
        vapiClientMethods: vapiClient ? Object.keys(vapiClient) : [],
      });

      if (!apiKey) {
        const errorMsg = "VAPI API key chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_VAPI_API_KEY vào .env.local";
        console.error("VAPI API key is missing. Please set NEXT_PUBLIC_VAPI_API_KEY in .env.local");
        setError(errorMsg);
        setConnecting(false);
        return;
      }

      if (!assistantId) {
        const errorMsg = "VAPI Assistant ID chưa được cấu hình. Vui lòng thêm NEXT_PUBLIC_VAPI_ASSISTANT_ID vào .env.local";
        console.error("VAPI Assistant ID is missing. Please set NEXT_PUBLIC_VAPI_ASSISTANT_ID in .env.local");
        setError(errorMsg);
        setConnecting(false);
        return;
      }

      // Check if vapi client has start method
      if (typeof vapiClient.start !== 'function') {
        const errorMsg = "VAPI client không hợp lệ. Vui lòng kiểm tra API key và khởi động lại server.";
        console.error("VAPI client missing start method:", vapiClient);
        setError(errorMsg);
        setConnecting(false);
        return;
      }

      // Check microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, VAPI will request its own
      } catch (micError: any) {
        const errorMsg = "Không thể truy cập microphone. Vui lòng cấp quyền microphone trong trình duyệt.";
        console.error("Microphone permission denied:", micError);
        setError(errorMsg);
        setConnecting(false);
        return;
      }

      // Set timeout for connection
      const timeoutId = setTimeout(() => {
        if (connecting) {
          setError("Kết nối quá lâu. Vui lòng kiểm tra API key và thử lại.");
          setConnecting(false);
        }
      }, 10000); // 10 second timeout

      try {
        console.log("Attempting to start VAPI call with Assistant ID:", assistantId);
        console.log("VAPI client:", vapiClient);
        const result = await vapiClient.start(assistantId);
        console.log("VAPI start result:", result);
        clearTimeout(timeoutId);
      } catch (startError: any) {
        clearTimeout(timeoutId);
        // Log detailed error information
        console.error("VAPI start error details:", {
          error: startError,
          type: typeof startError,
          keys: startError ? Object.keys(startError) : [],
          stringified: JSON.stringify(startError, null, 2),
          message: startError?.message,
          status: startError?.status || startError?.statusCode,
        });
        throw startError;
      }
    } catch (error: any) {
      console.error("Failed to start call:", error);
      const status = error?.status || error?.statusCode || error?.response?.status;
      const message = error?.message || error?.error?.message || error?.response?.data?.message;
      
      if (status === 403) {
        setError("Lỗi 403: API key không hợp lệ hoặc không có quyền truy cập Assistant này. Vui lòng kiểm tra lại trong VAPI dashboard.");
      } else if (message) {
        setError(`Lỗi: ${message}`);
      } else if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        setError("Không thể khởi tạo cuộc gọi. Vui lòng kiểm tra API key và Assistant ID trong .env.local và khởi động lại server.");
      } else {
        setError("Không thể bắt đầu cuộc gọi. Vui lòng thử lại sau.");
      }
      setConnecting(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 flex flex-col overflow-hidden pb-20">
      {/* TITLE */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-mono">
          <span>Talk to Your </span>
          <span className="text-primary uppercase">AI Dental Assistant</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Have a voice conversation with our AI assistant for dental advice and guidance
        </p>
      </div>

      {/* VIDEO CALL AREA */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* AI ASSISTANT CARD */}

        <Card className="bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative">
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
            {/* AI VOICE ANIMATION */}
            <div
              className={`absolute inset-0 ${
                isSpeaking ? "opacity-30" : "opacity-0"
              } transition-opacity duration-300`}
            >
              {/* voice wave animation when speaking */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`mx-1 h-16 w-1 bg-primary rounded-full ${
                      isSpeaking ? "animate-sound-wave" : ""
                    }`}
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* AI LOGO */}
            <div className="relative size-32 mb-4">
              <div
                className={`absolute inset-0 bg-primary opacity-10 rounded-full blur-lg ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              />

              <div className="relative w-full h-full rounded-full bg-card flex items-center justify-center border border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-primary/5"></div>
                <Image
                  src="/logo.png"
                  alt="AI Dental Assistant"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground">DentWise AI</h2>
            <p className="text-sm text-muted-foreground mt-1">Dental Assistant</p>

            {/* SPEAKING INDICATOR */}
            <div
              className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border ${
                isSpeaking ? "border-primary" : ""
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isSpeaking ? "bg-primary animate-pulse" : "bg-muted"
                }`}
              />

              <span className="text-xs text-muted-foreground">
                {isSpeaking
                  ? "Speaking..."
                  : callActive
                  ? "Listening..."
                  : callEnded
                  ? "Call ended"
                  : "Waiting..."}
              </span>
            </div>
          </div>
        </Card>

        {/* USER CARD */}
        <Card className={`bg-card/90 backdrop-blur-sm border overflow-hidden relative`}>
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative">
            {/* User Image */}
            <div className="relative size-32 mb-4">
              <Image
                src={user?.imageUrl!}
                alt="User"
                width={128}
                height={128}
                className="size-full object-cover rounded-full"
              />
            </div>

            <h2 className="text-xl font-bold text-foreground">You</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user ? (user.firstName + " " + (user.lastName || "")).trim() : "Guest"}
            </p>

            {/* User Ready Text */}
            <div className={`mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-card border`}>
              <div className={`w-2 h-2 rounded-full bg-muted`} />
              <span className="text-xs text-muted-foreground">Ready</span>
            </div>
          </div>
        </Card>
      </div>

      {/* MESSAGE CONTAINER */}
      {messages.length > 0 && (
        <div
          ref={messageContainerRef}
          className="w-full bg-card/90 backdrop-blur-sm border border-border rounded-xl p-4 mb-8 h-64 overflow-y-auto transition-all duration-300 scroll-smooth"
        >
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div key={index} className="message-item animate-in fade-in duration-300">
                <div className="font-semibold text-xs text-muted-foreground mb-1">
                  {msg.role === "assistant" ? "DentWise AI" : "You"}:
                </div>
                <p className="text-foreground">{msg.content}</p>
              </div>
            ))}

            {callEnded && (
              <div className="message-item animate-in fade-in duration-300">
                <div className="font-semibold text-xs text-primary mb-1">System:</div>
                <p className="text-foreground">Call ended. Thank you for using DentWise AI!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-destructive/70 hover:text-destructive underline"
          >
            Close
          </button>
        </div>
      )}

      {/* CALL CONTROLS */}
      <div className="w-full flex flex-col items-center gap-4">
        <Button
          className={`w-44 text-xl rounded-3xl ${
            callActive
              ? "bg-destructive hover:bg-destructive/90"
              : callEnded
              ? "bg-red-500 hover:bg-red-700"
              : "bg-primary hover:bg-primary/90"
          } text-white relative`}
          onClick={toggleCall}
          disabled={connecting || callEnded}
        >
          {connecting && (
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/50 opacity-75"></span>
          )}

          <span>
            {callActive
              ? "End Call"
              : connecting
              ? "Connecting..."
              : callEnded
              ? "Call Ended"
              : "Start Call"}
          </span>
        </Button>
        {!error && connecting && (
          <p className="text-sm text-muted-foreground">Connecting to AI Assistant...</p>
        )}
      </div>
    </div>
  );
}

export default VapiWidget;