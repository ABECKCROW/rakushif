import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
console.log("seed")
async function main() {
  await prisma.user.create({
    data: {
      name: "テスト太郎",
      email: "test@example.com"
    }
  });
}

main();