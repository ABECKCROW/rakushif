import { ActionFunctionArgs, LoaderFunction, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import prisma from '~/.server/db/client';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  HStack, 
  Text, 
  VStack,
  Badge,
  Code
} from '@chakra-ui/react';

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
    <Code
      display="inline-block"
      fontFamily="monospace"
      fontSize="1.2em"
      fontWeight="bold"
      p={2}
      bg="red.500"
      color="white"
      borderRadius="md"
      boxShadow="sm"
    >
      {hours}:{minutes}:{seconds}
    </Code>
  );
}

export default function Index() {
  const { status } = useLoaderData<{ status: Status }>();

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">出退勤打刻</Heading>

        <Box mb={6}>
          <Heading as="h2" size="md" mb={2}>
            現在のステータス: 
            <Badge ml={2} colorScheme={
              status === 'WORKING' ? 'green' : 
              status === 'ON_BREAK' ? 'orange' : 
              'gray'
            }>
              {statusText[status]}
            </Badge>
          </Heading>
          <Heading as="h3" size="sm">
            現在時刻: <RealtimeClock />
          </Heading>
        </Box>

        <Form method="post">
          <HStack spacing={4}>
            {status === 'NOT_WORKING' && (
              <Button 
                type="submit" 
                name="type" 
                value="START_WORK"
                colorScheme="blue"
              >
                出勤
              </Button>
            )}

            {status === 'WORKING' && (
              <>
                <Button 
                  type="submit" 
                  name="type" 
                  value="END_WORK"
                  colorScheme="red"
                >
                  退勤
                </Button>
                <Button 
                  type="submit" 
                  name="type" 
                  value="START_BREAK"
                  colorScheme="orange"
                >
                  休憩開始
                </Button>
              </>
            )}

            {status === 'ON_BREAK' && (
              <Button 
                type="submit" 
                name="type" 
                value="END_BREAK"
                colorScheme="green"
              >
                休憩終了
              </Button>
            )}
          </HStack>
        </Form>

        <VStack spacing={2} align="start" mt={4}>
          <Link to="/records">
            <Text color="blue.500">記録一覧を見る</Text>
          </Link>
          <Link to="/modify">
            <Text color="blue.500">打刻修正</Text>
          </Link>
        </VStack>
      </VStack>
    </Container>
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
