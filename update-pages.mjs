import fs from "fs";
import path from "path";

const files = [
  "app/page.tsx",
  "app/(user)/assignments/page.tsx",
  "app/(user)/uploads/page.tsx",
  "app/(user)/tasks/page.tsx",
  "app/(user)/proof-work/page.tsx",
  "app/(user)/leaderboard/page.tsx",
  "app/(user)/profile/page.tsx",
  "app/(user)/dashboard/page.tsx",
  "app/(user)/groups/[groupId]/task/[taskId]/verify/page.tsx",
  "app/(user)/groups/[groupId]/task/[taskId]/submit/page.tsx",
  "app/(user)/groups/[groupId]/task/[taskId]/page.tsx",
  "app/(user)/groups/[groupId]/task/create/page.tsx",
  "app/(user)/groups/[groupId]/penalties/page.tsx",
  "app/(user)/groups/[groupId]/settings/page.tsx",
  "app/(user)/groups/[groupId]/page.tsx",
  "app/(user)/groups/page.tsx",
  "app/(user)/groups/[groupId]/leaderboard/page.tsx",
  "app/(user)/groups/create/page.tsx",
  "app/(auth)/signup/page.tsx",
  "app/(auth)/login/page.tsx"
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes('export const dynamic = "force-dynamic";')) {
      // Find the first line after imports, or just prepend but keep "use client" if it exists.
      if (content.startsWith('"use client";') || content.startsWith("'use client';")) {
        content = content.replace(/^("use client";|'use client';)\n?/, '$1\n\nexport const dynamic = "force-dynamic";\n\n');
      } else {
        content = 'export const dynamic = "force-dynamic";\n\n' + content;
      }
      fs.writeFileSync(filePath, content, "utf-8");
    }
  }
}
console.log("Updated all page.tsx files.");
