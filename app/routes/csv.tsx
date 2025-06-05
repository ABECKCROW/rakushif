import type { LoaderFunction } from "@remix-run/node";
import { stringify } from "csv-stringify/sync";
import prisma from "~/.server/db/client";

export const loader: LoaderFunction = async () => {
  // 1) 期間パラメータをクエリから取得
  // const url = new URL(request.url);
  // const from = new Date(url.searchParams.get("from")!);
  // const to   = new Date(url.searchParams.get("to")!);

  // 2) DB クエリ
  const records = await prisma.record.findMany({
    where: {
      userId: 1,
      // timestamp: { gte: from, lte: to }
    },
    orderBy: { timestamp: "asc" },
  });

  // 3) 行データ生成
  const rows = records.map(r => ({
    "種別": translateType(r.type),
    "日時": r.timestamp.toISOString(),
  }));

  // 4) CSV 文字列化
  const csv = stringify(rows, { header: true });

  // 5) レスポンス
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition": `attachment; filename="test.csv"`,
      // "Content-Disposition": `attachment; filename="records_${from.toISOString().slice(0,10)}_${to.toISOString().slice(0,10)}.csv"`
    },
  });
};

const translateType = (t: string) => {
  switch (t) {
    case "START_WORK":
      return "出勤";
    case "END_WORK":
      return "退勤";
    case "START_BREAK":
      return "休憩開始";
    case "END_BREAK":
      return "休憩終了";
    default:
      return t;
  }
};