import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const publicId = process.argv[2];
if (!publicId) {
  console.error("Usage: npx tsx scripts/force-expire.ts <publicId>");
  process.exit(1);
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL missing in env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  const msg = await prisma.message.findUnique({
    where: { publicId },
    select: {
      publicId: true,
      status: true,
      expiresAt: true,
      authorizedAt: true,
      paymentIntentId: true,
      bondCents: true,
      deliveryFeeCents: true,
    },
  });

  if (!msg) {
    console.error("Message not found:", publicId);
    process.exit(1);
  }

  console.log("BEFORE:", msg);

  const past = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
  await prisma.message.update({
    where: { publicId },
    data: { expiresAt: past },
  });

  const after = await prisma.message.findUnique({
    where: { publicId },
    select: {
      publicId: true,
      status: true,
      expiresAt: true,
      authorizedAt: true,
      paymentIntentId: true,
    },
  });

  console.log("AFTER:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
