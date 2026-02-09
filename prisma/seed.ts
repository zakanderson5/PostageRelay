import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const slug = "demo";
  const userEmail = process.env.DEMO_RECEIVER_EMAIL || "demo@local.test";
  const userName = "Demo User";

  await prisma.bondPage.upsert({
    where: { slug },
    update: {
      displayName: userName,
      headline: "Send a message with a refundable bond",
      instructions:
        "Delivery fee is non-refundable. The bond is refundable unless I accept.",
      minBondCents: 500,
      allowBoost: true,
      maxBondCents: 1500,
      timeoutHours: 72,
      categoriesJson: ["Business", "Personal"],
      user: {
        update: {
          email: userEmail,
          name: userName,
        },
      },
    },
    create: {
      slug,
      displayName: userName,
      headline: "Send a message with a refundable bond",
      instructions:
        "Delivery fee is non-refundable. The bond is refundable unless I accept.",
      minBondCents: 500,
      allowBoost: true,
      maxBondCents: 1500,
      timeoutHours: 72,
      categoriesJson: ["Business", "Personal"],
      user: {
        create: {
          email: userEmail,
          name: userName,
        },
      },
    },
  });

  console.log(`✅ Seeded/updated: http://localhost:3000/u/${slug}`);
  console.log(`📩 Receiver email set to: ${userEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
