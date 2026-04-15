import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

import { getAuth } from "@/lib/auth";

let authHandler: ReturnType<typeof toNextJsHandler> | undefined;

function getAuthHandler(): ReturnType<typeof toNextJsHandler> {
  if (!authHandler) {
    authHandler = toNextJsHandler(getAuth());
  }

  return authHandler;
}

export function GET(request: NextRequest) {
  return getAuthHandler().GET(request);
}

export function POST(request: NextRequest) {
  return getAuthHandler().POST(request);
}
