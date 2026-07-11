import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { prisma } from "./prisma/client";

const PORT = process.env.PORT || 3000;

async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

main();
