/**
 * prisma/seed.ts
 * 2025-04-01 ～ 2025-06-06 の各日に、
 * 多様な打刻パターンの Record を生成する
 */
import { PrismaClient, RecordType } from "@prisma/client";
import bcrypt from "bcryptjs";

const { hash } = bcrypt;
const prisma = new PrismaClient();
const userId = 1; // 適宜変更

// JST 日付 + 時刻文字列("HH:MM") → Date
const jstDate = (base: Date, time: string) => {
  const yyyy = base.getFullYear().toString().padStart(4, "0");
  const mm = (base.getMonth() + 1).toString().padStart(2, "0");
  const dd = base.getDate().toString().padStart(2, "0");
  return new Date(`${yyyy}-${mm}-${dd}T${time}:00+09:00`);
};

/** 各日付に適用する打刻シナリオ関数 */
type Scenario = (date: Date) => {
  type: RecordType;
  timestamp: Date;
  userId: number;
  isModified?: boolean;
}[];

/* ========== シナリオ定義 ========== */
const scenarios: Scenario[] = [
  /* 0) 出退勤 & 休憩1回 */
  d => [
    { type: "START_WORK", timestamp: jstDate(d, "09:00"), userId },
    { type: "START_BREAK", timestamp: jstDate(d, "12:00"), userId },
    { type: "END_BREAK",   timestamp: jstDate(d, "13:00"), userId },
    { type: "END_WORK",   timestamp: jstDate(d, "18:00"), userId },
  ],

  /* 1) 出退勤のみ */
  d => [
    { type: "START_WORK", timestamp: jstDate(d, "09:15"), userId },
    { type: "END_WORK",   timestamp: jstDate(d, "18:05"), userId },
  ],

  /* 2) 休憩2回（計4打刻） */
  d => [
    { type: "START_WORK",  timestamp: jstDate(d, "08:45"), userId },
    { type: "START_BREAK", timestamp: jstDate(d, "11:00"), userId },
    { type: "END_BREAK",   timestamp: jstDate(d, "11:15"), userId },
    { type: "START_BREAK", timestamp: jstDate(d, "15:00"), userId },
    { type: "END_BREAK",   timestamp: jstDate(d, "15:20"), userId },
    { type: "END_WORK",    timestamp: jstDate(d, "17:45"), userId },
  ],

  /* 3) 出勤時刻が 0:00 */
  d => [
    { type: "START_WORK", timestamp: jstDate(d, "00:00"), userId },
    { type: "END_WORK",   timestamp: jstDate(d, "09:00"), userId },
  ],

  /* 4) 退勤時刻が 0:00（翌日 0:00 と区別のため isModified=true） */
  d => [
    { type: "START_WORK",            timestamp: jstDate(d, "15:00"), userId },
    { type: "END_WORK", isModified: true, timestamp: jstDate(d, "00:00"), userId },
  ],

  /* 5) 打刻1件のみ START_WORK */
  d => [{ type: "START_WORK", timestamp: jstDate(d, "10:00"), userId }],

  /* 6) 打刻1件のみ END_WORK */
  d => [{ type: "END_WORK", timestamp: jstDate(d, "20:00"), userId }],

  /* 7) 打刻1件のみ START_BREAK */
  d => [{ type: "START_BREAK", timestamp: jstDate(d, "12:30"), userId }],

  /* 8) 打刻1件のみ END_BREAK */
  d => [{ type: "END_BREAK", timestamp: jstDate(d, "13:00"), userId }],

  /* 9) START_WORK だけで END_WORK なし */
  d => [
    { type: "START_WORK", timestamp: jstDate(d, "09:00"), userId },
    { type: "START_BREAK", timestamp: jstDate(d, "12:00"), userId },
    { type: "END_BREAK", timestamp: jstDate(d, "12:45"), userId },
  ],

  /* 10) END_WORK だけで START_WORK なし */
  d => [
    { type: "END_WORK", timestamp: jstDate(d, "18:00"), userId },
  ],

  /* 11) START_BREAK だけで END_BREAK なし */
  d => [
    { type: "START_WORK", timestamp: jstDate(d, "09:00"), userId },
    { type: "START_BREAK", timestamp: jstDate(d, "12:10"), userId },
    { type: "END_WORK", timestamp: jstDate(d, "19:00"), userId },
  ],

  /* 12) END_BREAK だけで START_BREAK なし */
  d => [
    { type: "START_WORK", timestamp: jstDate(d, "08:30"), userId },
    { type: "END_BREAK", timestamp: jstDate(d, "13:00"), userId },
    { type: "END_WORK", timestamp: jstDate(d, "17:30"), userId },
  ],
];
/* ========== ここまでシナリオ定義 ========== */

async function main() {
  // Create default user with hashed password
  const hashedPassword = await hash("Password1!", 10);

  // Delete existing user if it exists (to avoid conflicts)
  await prisma.user.deleteMany({
    where: { id: userId }
  });

  // Create the user
  await prisma.user.create({
    data: {
      id: userId,
      name: "テストユーザー",
      email: "test@example.com",
      passwordHash: hashedPassword,
      role: "user",
      emailVerified: true,
    }
  });

  console.log("✅ Default user created");

  // Delete existing records if they exist
  await prisma.record.deleteMany({
    where: { userId }
  });

  const start = new Date("2025-04-01T00:00:00+09:00");
  const end   = new Date("2025-06-06T00:00:00+09:00");

  for (let day = 0, d = new Date(start); d <= end; day++, d.setDate(d.getDate() + 1)) {
    const scenario = scenarios[day % scenarios.length];
    const records = scenario(new Date(d));

    // バルク insert
    await prisma.record.createMany({ data: records });
  }
}

main()
  .then(() => {
    console.log("✅ Seed 完了");
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
