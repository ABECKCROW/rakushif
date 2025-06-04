import { useEffect, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import prisma from '~/.server/db/client';

export async function loader() {
  const userId = 1; // 仮ユーザーID

  const records = await prisma.record.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });

  return records;
}

export default function RecordsPage() {
  const records = useLoaderData<typeof loader>();

  function ClientOnlyDate({ timestamp }: { timestamp: string }) {
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
  }

  return (
    <div>
      <h1>記録一覧</h1>
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
    </div>
  );
}

function translateType(type: string): string {
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
}