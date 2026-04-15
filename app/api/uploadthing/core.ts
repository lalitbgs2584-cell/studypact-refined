import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";  // Assume server-safe

const f = createUploadthing();

export const ourFileRouter = {
  proofUpload: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 2 }
  })
    .middleware(async ({ req }) => {  // Use req from middleware args
      const session = await auth.api.getSession({ 
        headers: new Headers(req.headers as HeadersInit)  // Pass req.headers
      });
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;