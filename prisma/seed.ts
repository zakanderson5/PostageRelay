import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const userEmail = "demo@local.test";
  const slug = "demo";

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: { email: userEmail, name: "Demo User" },
  });

  await prisma.bondPage.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug,
      displayName: "Demo User",
      headline: "Send a message with a refundable bond",
      instructions:
        "Delivery fee is non-refundable. The bond is refundable unless I accept.",
      minBondCents: 500,
      allowBoost: true,
      maxBondCents: 1500,
      timeoutHours: 72,
      categoriesJson: ["Business", "Personal"],
    },
  });

  console.log(`✅ Seeded: ${userEmail} -> http://localhost:3000/u/${slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
