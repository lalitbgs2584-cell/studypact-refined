import { createServer } from "http";
import { parse } from "url";
import next from "next";
import cron from "node-cron";
import { initSocketServer } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO to the same HTTP server
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? "dev" : "prod"}]`);
    
    // Simulate Vercel Cron within our native Docker container
    // Run at midnight every day
    cron.schedule("0 0 * * *", async () => {
      console.log("[Cron Engine] Firing daily Vercel cron simulation...");
      try {
        const cronSecret = process.env.CRON_SECRET || "";
        const res = await fetch(`http://localhost:${port}/api/cron`, {
          headers: {
            "Authorization": `Bearer ${cronSecret}`
          }
        });
        const data = await res.json();
        console.log(`[Cron Engine] Result:`, data);
      } catch (err) {
        console.error(`[Cron Engine] Failed to dispatch internal cron:`, err);
      }
    });
  });
});
