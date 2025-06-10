import type { LoaderFunction } from "@remix-run/node";
import { stringify } from "csv-stringify/sync";
import prisma from "~/.server/db/client";
import { calculateDailyData, getDateRangeString, groupRecordsByDate, HOURLY_RATE } from "~/utils/recordUtils";

export const loader: LoaderFunction = async ({ request }) => {
  // 1) 期間パラメータをクエリから取得
  const url = new URL(request.url);
  let from = new Date();
  let to = new Date();

  if (url.searchParams.has("from") && url.searchParams.has("to")) {
    from = new Date(url.searchParams.get("from")!);
    to = new Date(url.searchParams.get("to")!);

    // 終了日の時間を23:59:59に設定して、その日全体を含める
    to.setHours(23, 59, 59, 999);
  } else {
    // デフォルトは現在の月の範囲
    from = new Date(from.getFullYear(), from.getMonth(), 1);
    to = new Date(to.getFullYear(), to.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // 2) DB クエリ (論理削除されていないもののみ)
  const records = await prisma.record.findMany({
    where: {
      userId: 1,
      timestamp: { gte: from, lte: to },
      isDeleted: false,
    },
    orderBy: { timestamp: "asc" },
    include: { user: true },
  });

  // ユーザー情報を取得
  const user = records.length > 0 ? records[0].user : await prisma.user.findFirst({ where: { id: 1 } });
  const userName = user?.name || "M"; // デフォルト値を "M" に設定

  // 3) 日付ごとにレコードをグループ化
  const recordsByDate = groupRecordsByDate(records);

  // 4) 日ごとのデータを計算して行データを生成
  const dailyData = calculateDailyData(recordsByDate);

  // 5) 月の合計を計算
  const monthlyTotal = dailyData.reduce((sum, day) => sum + day.dailyWage, 0);

  // 6) 期間の表示用文字列を生成
  const monthStr = getDateRangeString(from, to);

  // 7) CSVヘッダー行を生成
  const headerRow = [`# ユーザー: ${userName} / 月: ${monthStr} / 時給: ${HOURLY_RATE.toLocaleString()}円`];

  // 8) CSV列ヘッダー行
  const columnHeaders = ["日付", "出勤時刻", "退勤時刻", "労働時間", "休憩時間", "日給", "備考"];

  // 9) CSV行データ生成
  const rows = dailyData.map(day => [
    day.dateStr,
    day.startTime || "",
    day.endTime || "",
    day.workHours || "",
    day.breakTime || "",
    day.dailyWage ? `${day.dailyWage.toLocaleString()}円` : "",
    day.notes || "",
  ]);

  // 10) 月給合計行を追加
  const totalRow = ["", "", "", "", "月給合計", `${monthlyTotal.toLocaleString()}円`, ""];

  // 11) すべての行を結合
  const allRows = [headerRow, columnHeaders, ...rows, totalRow];

  // 12) CSV 文字列化
  const csv = stringify(allRows);

  // 13) レスポンス
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition": `attachment; filename="records_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv"`,
    },
  });
};
