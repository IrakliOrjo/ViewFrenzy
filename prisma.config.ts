import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

const url = process.env["DIRECT_URL"]!;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
