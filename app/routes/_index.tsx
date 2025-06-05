import { PrismaClient } from '@prisma/client';
import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link } from '@remix-run/react';
import styles from '../styles/index.css';

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export default function Index() {
  return (
    <div>
      <h1>出退勤打刻</h1>
      <Form method="post">
        <button className="btn" type="submit" name="type" value="START_WORK">出勤</button>
        <button className="btn" type="submit" name="type" value="END_WORK">退勤</button>
        <button className="btn" type="submit" name="type" value="START_BREAK">休憩開始</button>
        <button className="btn" type="submit" name="type" value="END_BREAK">休憩終了</button>
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
  const prisma = new PrismaClient();

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
      type,
    },
  });

  return redirect("/");
}