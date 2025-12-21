"use client";

import Vapi from "@vapi-ai/web";

type VapiClient = {
  start: (assistantId?: string) => Promise<any>;
  stop: () => any;
  on: (event: string, cb: (...args: any[]) => void) => any;
  off: (event: string, cb: (...args: any[]) => void) => any;
};

// Create a no-op stub so server rendering and missing envs don't crash the app.
const createStub = (): VapiClient => {
  const stub = {
    start: async () => {},
    stop: () => {},
    on: (_event: string, _cb: (...args: any[]) => void) => stub,
    off: (_event: string, _cb: (...args: any[]) => void) => stub,
  };
  return stub;
};

const createClient = (): any => {
  if (typeof window === "undefined") {
    console.warn("VAPI: Server-side rendering detected, using stub client.");
    return createStub();
  }
  
  const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
  if (!apiKey) {
    console.warn("VAPI: Missing NEXT_PUBLIC_VAPI_API_KEY; using stub client.");
    return createStub();
  }
  
  // Validate API key format (should be a UUID)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey)) {
    console.warn("VAPI: API key format appears invalid. Expected UUID format. Got:", apiKey.substring(0, 8) + "...");
  }
  
  try {
    console.log("VAPI: Initializing client with API key:", apiKey.substring(0, 8) + "...");
    const client = new Vapi(apiKey);
    console.log("VAPI: Client initialized successfully");
    return client;
  } catch (err) {
    console.error("VAPI: Failed to init client; using stub.", err);
    return createStub();
  }
};

export const vapi = createClient() as any;