"use client";

// UploadThing's SSR plugin has been unstable in this Docker/Next runtime.
// The upload dropzone still works without it because the client component can
// fetch its route config directly when needed.
export function UploadthingProvider() {
  return null;
}
