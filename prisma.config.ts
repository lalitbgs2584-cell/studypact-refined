import 'dotenv/config';  // Correct preload syntax—no .default() needed
import { defineConfig, env } from 'prisma/config';  // No manual dotenv.config()

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),  // Type-safe env access
  },
});