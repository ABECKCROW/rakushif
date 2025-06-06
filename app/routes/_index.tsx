import { ActionFunctionArgs, LoaderFunction, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import prisma from '~/.server/db/client';
import stylesUrl from '../styles/index.css?url';

export function links() {
  return [{ rel: "stylesheet", href: stylesUrl }];
}

// ステータスの種類
type Status = 'WORKING' | 'ON_BREAK' | 'NOT_WORKING';

// ステータスの日本語表示
const statusText = {
  WORKING: '勤務中',
  ON_BREAK: '休憩中',
  NOT_WORKING: '勤務していません'
};

export const loader: LoaderFunction = async () => {
  // 最新の記録を取得
  const latestRecord = await prisma.record.findFirst({
    where: { userId: 1 },
    orderBy: { timestamp: 'desc' },
  });

  // 現在のステータスを判定
  let status: Status = 'NOT_WORKING';

  if (latestRecord) {
    switch (latestRecord.type) {
      case 'START_WORK':
        status = 'WORKING';
        break;
      case 'END_WORK':
        status = 'NOT_WORKING';
        break;
      case 'START_BREAK':
        status = 'ON_BREAK';
        break;
      case 'END_BREAK':
        status = 'WORKING';
        break;
    }
  }

  return { status };
};

// リアルタイムクロックコンポーネント
function RealtimeClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1秒ごとに現在時刻を更新
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // 初回実行
    updateTime();

    // 1秒ごとに更新
    const timer = setInterval(updateTime, 1000);

    // クリーンアップ関数
    return () => clearInterval(timer);
  }, []);

  // 時刻のフォーマット (hh:mm:ss)
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <div className="clock" style={{ 
      display: 'inline-block',
      fontFamily: 'monospace',
      fontSize: '1.2em',
      fontWeight: 'bold',
      padding: '4px 8px',
      backgroundColor: '#ff0000',
      borderRadius: '4px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <span>{hours}:{minutes}:{seconds}</span>
    </div>
  );
}

export default function Index() {
  const { status } = useLoaderData<{ status: Status }>();

  return (
    <div>
      <h1>出退勤打刻</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>現在のステータス: {statusText[status]}</h2>
        <h3>現在時刻: <RealtimeClock /></h3>
      </div>

      <Form method="post">
        {status === 'NOT_WORKING' && (
          <button className="btn" type="submit" name="type" value="START_WORK">出勤</button>
        )}

        {status === 'WORKING' && (
          <>
            <button className="btn" type="submit" name="type" value="END_WORK">退勤</button>
            <button className="btn" type="submit" name="type" value="START_BREAK">休憩開始</button>
          </>
        )}

        {status === 'ON_BREAK' && (
          <button className="btn" type="submit" name="type" value="END_BREAK">休憩終了</button>
        )}
      </Form>

      <p>
        <Link to="/records">記録一覧を見る</Link>
      </p>
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const type = form.get("type");

  if (
    type !== "START_WORK" &&
    type !== "END_WORK" &&
    type !== "START_BREAK" &&
    type !== "END_BREAK"
  ) {
    return new Response("Invalid type", { status: 400 });
  }

  await prisma.record.create({
    data: {
      userId: 1, // 仮ユーザーID
      type: type as string,
    },
  });

  return redirect("/");
}
