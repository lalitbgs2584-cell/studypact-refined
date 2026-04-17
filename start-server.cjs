/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "production";
process.env.TZ = process.env.TZ || "Asia/Kolkata";

const serverEntry = path.join(__dirname, ".server-dist", "server.js");

if (!fs.existsSync(serverEntry)) {
  console.error("Missing .server-dist/server.js. Run the build script before starting production.");
  process.exit(1);
}

require(serverEntry);
