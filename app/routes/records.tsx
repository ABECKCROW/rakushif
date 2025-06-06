import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import prisma from '~/.server/db/client';

export const loader = () => {
  const userId = 1; // 仮ユーザーID

  return prisma.record.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });
};

export const RecordsPage = () => {
  const records = useLoaderData<typeof loader>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Initialize with current month's start and end dates
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
  }, []);

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

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

  const getCsvUrl = () => {
    if (!startDate || !endDate) return "/csv";
    return `/csv?from=${startDate}&to=${endDate}`;
  };

  return (
    <div>
      <h1>記録一覧</h1>

      <div style={{ marginBottom: "20px" }}>
        <h2>CSVダウンロード期間選択</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <label>
            開始日:
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            終了日:
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      <table border={1}>
        <thead>
        <tr>
          <th>記録種別</th>
          <th>日時</th>
        </tr>
        </thead>
        <tbody>
        {records.map((r) => (
          <tr key={r.id}>
            <td>{translateType(r.type)}</td>
            <td><ClientOnlyDate timestamp={r.timestamp} /></td>
          </tr>
        ))}
        </tbody>
      </table>
      <p>
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
