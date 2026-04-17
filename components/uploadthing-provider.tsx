import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

/**
 * Server component that pre-sends the UploadThing route config during SSR.
 * This prevents the client from making an extra round-trip to fetch the
 * route config before it can show the upload dropzone.
 *
 * Render this in the root layout, inside <body>, before {children}.
 */
export function UploadthingProvider() {
  return (
    <NextSSRPlugin
      routerConfig={extractRouterConfig(ourFileRouter)}
    />
  );
}
