import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from 'node:path';
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
    migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts" 
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
