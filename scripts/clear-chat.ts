import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const msgs = await prisma.message.deleteMany({});
  const convs = await prisma.conversation.deleteMany({});
  console.log(`Deleted ${msgs.count} messages and ${convs.count} conversations`);
  await prisma.$disconnect();
}

main();
