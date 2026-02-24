import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create or find seed user for initial groups
  const seedEmail = "seed@studio730.local";
  let seedUser = await prisma.user.findUnique({
    where: { email: seedEmail },
  });

  if (!seedUser) {
    const hashedPassword = await bcrypt.hash("seed-password-change-me", 10);
    seedUser = await prisma.user.create({
      data: {
        email: seedEmail,
        password: hashedPassword,
        nickname: "Studio 730 Seed",
        role: "admin",
      },
    });
    console.log("Created seed user for initial groups");
  }

  // Seed initial groups (Cupertino and Palo Alto)
  const cupertinoGroup = await prisma.group.upsert({
    where: { id: "studio-730-cupertino" },
    update: {},
    create: {
      id: "studio-730-cupertino",
      name: "Studio 7:30 (Cupertino)",
      location: "Cupertino",
      day: "Thursday",
      time: "7:30 PM",
      description: "Join us every Thursday at 7:30 PM in Cupertino",
      createdById: seedUser.id,
    },
  });

  const paloAltoGroup = await prisma.group.upsert({
    where: { id: "studio-800-palo-alto" },
    update: {},
    create: {
      id: "studio-800-palo-alto",
      name: "Studio 8:00 (Palo Alto)",
      location: "Palo Alto",
      day: "Sunday",
      time: "8:00 AM",
      description: "Join us every Sunday at 8:00 AM in Palo Alto",
      createdById: seedUser.id,
    },
  });

  console.log("Seeded groups:", cupertinoGroup.name, paloAltoGroup.name);

  // Backfill existing records: set groupId where gathering matches

  const cupertinoUpdated = await prisma.record.updateMany({
    where: {
      gathering: "Studio 7:30 (Cupertino)",
      groupId: null,
    },
    data: { groupId: cupertinoGroup.id },
  });

  const paloAltoUpdated = await prisma.record.updateMany({
    where: {
      gathering: "Studio 8:00 (Palo Alto)",
      groupId: null,
    },
    data: { groupId: paloAltoGroup.id },
  });

  console.log(
    `Backfilled records: Cupertino ${cupertinoUpdated.count}, Palo Alto ${paloAltoUpdated.count}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
