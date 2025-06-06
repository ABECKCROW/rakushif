import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import prisma from '~/.server/db/client';
import { useDateRange } from "~/hooks/useDateRange";
import {
  calculateDailyData,
  getDateRangeString,
  groupRecordsByDate,
  HOURLY_RATE,
  translateType,
} from "~/utils/recordUtils";

export const loader = async ({ request }) => {
  const userId = 1; // 仮ユーザーID

  // URLからクエリパラメータを取得
  const url = new URL(request.url);
  let from, to;

  if (url.searchParams.has("from") && url.searchParams.has("to")) {
    from = new Date(url.searchParams.get("from"));
    to = new Date(url.searchParams.get("to"));

    // 終了日の時間を23:59:59に設定して、その日全体を含める
    to.setHours(23, 59, 59, 999);
  } else {
    // 現在の月の範囲を取得
    const now = new Date();
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // レコードを取得
  const records = await prisma.record.findMany({
    where: {
      userId,
      timestamp: { gte: from, lte: to },
    },
    orderBy: { timestamp: "asc" },
    include: { user: true },
  });

  // ユーザー情報を取得
  const user = records.length > 0 ? records[0].user : await prisma.user.findFirst({ where: { id: 1 } });
  const userName = user?.name || "M"; // デフォルト値を "M" に設定

  // 日付ごとにレコードをグループ化
  const recordsByDate = groupRecordsByDate(records);

  // 日ごとのデータを計算
  const dailyData = calculateDailyData(recordsByDate);

  // 月の合計を計算
  const monthlyTotal = dailyData.reduce((sum, day) => sum + day.dailyWage, 0);

  // 期間の表示用文字列を生成
  const monthStr = getDateRangeString(from, to);

  return {
    records,
    dailyData,
    monthlyTotal,
    userName,
    monthStr,
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
};

export const RecordsPage = () => {
  const data = useLoaderData<typeof loader>();

  // 日付範囲の状態管理にカスタムフックを使用
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    getCsvUrl,
  } = useDateRange(data.from, data.to);

  const ClientOnlyDate = ({ timestamp }: { timestamp: Date }) => {
    const [formatted, setFormatted] = useState("");

    useEffect(() => {
      const date = new Date(timestamp);
      setFormatted(date.toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        dateStyle: "medium",
        timeStyle: "short",
      }));
    }, [timestamp]);

    return <>{formatted}</>;
  };

  return (
    <div>
      <h1>勤怠記録</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>期間選択</h2>
        <form method="get" action="/records">
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label>
              開始日:
              <input
                type="date"
                name="from"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              終了日:
              <input
                type="date"
                name="to"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <button type="submit">表示更新</button>
          </div>
        </form>
      </div>

      <h2>月別サマリー</h2>
      <p>ユーザー: {data.userName} / 月: {data.monthStr} / 時給: {HOURLY_RATE.toLocaleString()}円</p>

      <table border={1} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
        <tr style={{ backgroundColor: "#ff0000" }}>
          <th>日付</th>
          <th>出勤時刻</th>
          <th>退勤時刻</th>
          <th>労働時間</th>
          <th>休憩時間</th>
          <th>日給</th>
          <th>備考</th>
        </tr>
        </thead>
        <tbody>
        {data.dailyData.map((day, index) => (
          <tr key={index}>
            <td>{day.dateStr}</td>
            <td>{day.startTime}</td>
            <td>{day.endTime}</td>
            <td>{day.workHours}</td>
            <td>{day.breakTime}</td>
            <td>{day.dailyWage ? `${day.dailyWage.toLocaleString()}円` : ""}</td>
            <td>{day.notes}</td>
          </tr>
        ))}
        <tr style={{ fontWeight: "bold", backgroundColor: "#ff0000" }}>
          <td colSpan={4}></td>
          <td>月給合計</td>
          <td>{data.monthlyTotal.toLocaleString()}円</td>
          <td></td>
        </tr>
        </tbody>
      </table>

      <h2>記録一覧</h2>
      <table border={1} style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
        <tr style={{ backgroundColor: "#ff0000" }}>
          <th>記録種別</th>
          <th>日時</th>
        </tr>
        </thead>
        <tbody>
        {data.records.map((r) => (
          <tr key={r.id}>
            <td>{translateType(r.type)}</td>
            <td><ClientOnlyDate timestamp={r.timestamp} /></td>
          </tr>
        ))}
        </tbody>
      </table>

      <p style={{ marginTop: "20px" }}>
        <Link to={getCsvUrl()} reloadDocument>
          📥 CSVをダウンロード
        </Link>
      </p>
    </div>
  );
};

const translateType = (type: string): string => {
  switch (type) {
    case "START_WORK":
      return "出勤";
    case "END_WORK":
      return "退勤";
    case "START_BREAK":
      return "休憩開始";
    case "END_BREAK":
      return "休憩終了";
    default:
      return type;
  }
};

export default RecordsPage;
