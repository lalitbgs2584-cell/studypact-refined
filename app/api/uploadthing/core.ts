import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuth } from "@/lib/auth";
const f = createUploadthing();

export const ourFileRouter = {
  proofUpload: f({
    image: { maxFileSize: "4MB", maxFileCount: 2 },
  })
    .middleware(async ({ req }) => {
      const session = await getAuth().api.getSession({
        headers: req.headers,
      });
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
