const path = require("path");

process.env.NODE_ENV = "production";
process.env.TS_NODE_PROJECT = path.join(__dirname, "tsconfig.server.json");

require("ts-node/register/transpile-only");
require("tsconfig-paths/register");
require("./server.ts");
