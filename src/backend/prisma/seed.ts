import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: "EventHub",
      slug: "eventhub",
      description: "Event management platform for organizing conferences, meetups, and workshops",
      email: "admin@eventhub.com",
      phone: "+95 9 123 456 789",
      address: "Yangon, Myanmar",
    },
  });
  console.log(`✅ Created organization: ${org.name} (${org.id})`);

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "admin@eventhub.com",
      passwordHash,
      role: "admin",
      phone: "+95 9 123 456 789",
      profile: {
        create: {
          firstName: "Admin",
          lastName: "User",
        },
      },
    },
  });
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create staff user
  const staff = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "staff@eventhub.com",
      passwordHash,
      role: "staff",
      phone: "+95 9 987 654 321",
      profile: {
        create: {
          firstName: "Staff",
          lastName: "User",
        },
      },
    },
  });
  console.log(`✅ Created staff user: ${staff.email}`);

  // Create sample members
  const members = [
    {
      firstName: "John",
      lastName: "Doe",
      phone: "+95 9 111 111 111",
      email: "john@example.com",
      membershipType: "regular",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      phone: "+95 9 222 222 222",
      email: "jane@example.com",
      membershipType: "premium",
    },
    {
      firstName: "Myanmar",
      lastName: "Member",
      phone: "+95 9 333 333 333",
      membershipType: "regular",
    },
  ];

  for (const memberData of members) {
    const member = await prisma.member.create({
      data: {
        orgId: org.id,
        ...memberData,
      },
    });
    console.log(`✅ Created member: ${member.firstName} ${member.lastName}`);
  }

  // Create sample event
  const event = await prisma.event.create({
    data: {
      orgId: org.id,
      title: "Tech Conference 2026",
      description: "Annual technology conference featuring the latest trends",
      location: "Yangon Convention Center",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      capacity: 100,
      registrationMode: "member",
      status: "published",
      createdById: admin.id,
    },
  });
  console.log(`✅ Created event: ${event.title}`);

  // Create sample announcement
  const announcement = await prisma.announcement.create({
    data: {
      orgId: org.id,
      title: "Welcome to EventHub",
      content: "Welcome to our event management platform!",
      priority: "normal",
      status: "published",
      publishedAt: new Date(),
      createdById: admin.id,
    },
  });
  console.log(`✅ Created announcement: ${announcement.title}`);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test Credentials:");
  console.log("   Admin: admin@eventhub.com / admin123");
  console.log("   Staff: staff@eventhub.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
