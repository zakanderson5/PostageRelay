import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const msg = await prisma.message.findFirst({
    where: { status: "AUTHORIZED" },
    orderBy: { createdAt: "desc" },
  });

  if (!msg) throw new Error("No AUTHORIZED messages found. Create & pay one first.");

  const past = new Date(Date.now() - 60_000);
  await prisma.message.update({
    where: { id: msg.id },
    data: { expiresAt: past },
  });

  console.log("✅ Forced expiresAt into the past for message:", msg.publicId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
