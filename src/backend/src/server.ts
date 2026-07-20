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
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n⏹️  Shutting down...");
    server.close(() => {
      console.log("   HTTP server closed");
    });
    await prisma.$disconnect();
    console.log("   Database disconnected");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
