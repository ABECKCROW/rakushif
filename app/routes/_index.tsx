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
  useToast
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
  // ユーザー情報を取得 (現在は固定のユーザーID=1を使用)
  const userId = 1;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // 最新の記録を取得
  const latestRecord = await prisma.record.findFirst({
    where: { userId },
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

  // 今日の記録を取得
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const todayRecords = await prisma.record.findMany({
    where: {
      userId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  return { status, user, todayRecords };
};

// リアルタイムクロックコンポーネント
function RealtimeClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!currentTime) {
    return null;
  }

  // 日付のフォーマット (yyyy/MM/dd)
  const year = currentTime.getFullYear();
  const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
  const day = currentTime.getDate().toString().padStart(2, '0');
  const formattedDate = `${year}/${month}/${day}`;

  // 時刻のフォーマット (hh:mm:ss)
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  return (
    <VStack spacing={1}>
      <Text
        fontSize="sm"
        fontWeight="medium"
      >
        {formattedDate}
      </Text>
      <Text
        fontSize="6xl"
        fontWeight="bold"
        letterSpacing="wider"
      >
        {hours}:{minutes}:{seconds}
      </Text>
    </VStack>
  );
}

// 打刻時間を表示するコンポーネント
function TodayRecords({ records }: { records: any[] }) {
  if (records.length === 0) {
    return null;
  }

  // 記録タイプの日本語表示
  const recordTypeText = {
    START_WORK: '出勤',
    END_WORK: '退勤',
    START_BREAK: '休憩開始',
    END_BREAK: '休憩終了'
  };

  // 時刻のフォーマット
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <VStack spacing={1} width="100%" fontSize="xs" mt={2}>
      {records.map((record, index) => (
        <HStack key={index} width="100%" justifyContent="center" spacing={4}>
          <Text fontWeight="bold">{recordTypeText[record.type as keyof typeof recordTypeText]}:</Text>
          <Text>{formatTime(record.timestamp)}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

// 出勤時の励ましメッセージ
const startWorkMessages = [
  "今日も一日頑張りましょう！",
  "素晴らしい一日になりますように！",
  "今日も元気に頑張りましょう！",
  "今日の仕事も順調に進みますように！",
  "新しい一日の始まりです！頑張りましょう！"
];

// 退勤時の励ましメッセージ
const endWorkMessages = [
  "今日も一日お疲れ様でした！",
  "素晴らしい仕事ぶりでした！",
  "ゆっくり休んでください！",
  "明日も素晴らしい一日になりますように！",
  "今日の頑張りに感謝します！"
];

// 休憩開始時の励ましメッセージ
const startBreakMessages = [
  "しっかり休憩して、リフレッシュしましょう！",
  "少し休んで、英気を養いましょう！",
  "休憩は大切です！しっかり休んでください！",
  "コーヒーでも飲んでリラックスしましょう！",
  "休憩時間を楽しんでください！"
];

// 休憩終了時の励ましメッセージ
const endBreakMessages = [
  "リフレッシュできましたか？また頑張りましょう！",
  "休憩後も引き続き頑張りましょう！",
  "英気を養えましたか？残りの仕事も頑張りましょう！",
  "休憩後も素晴らしい仕事を期待しています！",
  "さあ、また仕事に戻りましょう！"
];

// ランダムなメッセージを取得する関数
function getRandomMessage(messages: string[]): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

export default function Index() {
  const { status, user, todayRecords } = useLoaderData<{ 
    status: Status, 
    user: { id: number, name: string, email: string } | null,
    todayRecords: any[]
  }>();

  // Initialize toast
  const toast = useToast();

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Box 
          bg="blue.500" 
          color="white" 
          p={4} 
          borderRadius="md" 
          width="100%" 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
        >
          <Heading as="h1" size="xl">出退勤打刻</Heading>
          {user && (
            <HStack spacing={2}>
              <Link to="/account">
                <Button size="sm" colorScheme="whiteAlpha" _active={{
                  transform: 'scale(0.95)',
                  transition: 'transform 0.1s',
                }}>{user.name}</Button>
              </Link>
            </HStack>
          )}
        </Box>

        <Box p={6} borderRadius="lg">
          <VStack spacing={6} align="center">
            <Badge 
              fontSize="sm" 
              colorScheme={
                status === 'WORKING' ? 'green' : 
                status === 'ON_BREAK' ? 'orange' : 
                'gray'
              }
              p={1}
              borderRadius="md"
            >
              {statusText[status]}
            </Badge>

            <Box 
              p={6}
              bg="gray.50"
              borderRadius="lg"
              boxShadow="md"
              width="100%"
              textAlign="center"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <RealtimeClock />
            </Box>

            <TodayRecords records={todayRecords} />

            <Form method="post" width="100%" onSubmit={(e) => {
              // Get the button value and store form reference
              const form = e.currentTarget;
              const formData = new FormData(form);
              const type = formData.get("type") as string;

              // Show toast with random encouraging message based on action type
              let title = "";
              switch(type) {
                case "START_WORK":
                  title = getRandomMessage(startWorkMessages);
                  break;
                case "END_WORK":
                  title = getRandomMessage(endWorkMessages);
                  break;
                case "START_BREAK":
                  title = getRandomMessage(startBreakMessages);
                  break;
                case "END_BREAK":
                  title = getRandomMessage(endBreakMessages);
                  break;
              }

              toast({
                title: title,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top"
              });

            }}>
              <VStack spacing={4} width="100%">
                {status === 'NOT_WORKING' && (
                  <Button 
                    type="submit" 
                    name="type" 
                    value="START_WORK"
                    colorScheme="blue"
                    size="lg"
                    width="100%"
                    _active={{
                      transform: 'scale(0.95)',
                      transition: 'transform 0.1s'
                    }}
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
                      size="lg"
                      width="100%"
                      _active={{
                        transform: 'scale(0.95)',
                        transition: 'transform 0.1s'
                      }}
                    >
                      退勤
                    </Button>
                    <Button 
                      type="submit" 
                      name="type" 
                      value="START_BREAK"
                      colorScheme="orange"
                      size="lg"
                      width="100%"
                      _active={{
                        transform: 'scale(0.95)',
                        transition: 'transform 0.1s'
                      }}
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
                    size="lg"
                    width="100%"
                    _active={{
                      transform: 'scale(0.95)',
                      transition: 'transform 0.1s'
                    }}
                  >
                    休憩終了
                  </Button>
                )}
              </VStack>
            </Form>

            <HStack spacing={4} mt={4} width="100%">
              <Link to="/records" style={{ width: '50%' }}>
                <Button 
                  colorScheme="blue" 
                  width="100%"
                  _active={{
                    transform: 'scale(0.95)',
                    transition: 'transform 0.1s'
                  }}
                >
                  記録一覧を見る
                </Button>
              </Link>
              <Link to="/modify" style={{ width: '50%' }}>
                <Button 
                  colorScheme="teal" 
                  width="100%"
                  _active={{
                    transform: 'scale(0.95)',
                    transition: 'transform 0.1s'
                  }}
                >
                  打刻修正
                </Button>
              </Link>
            </HStack>
          </VStack>
        </Box>
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

  // 現在は固定のユーザーID=1を使用
  const userId = 1;

  await prisma.record.create({
    data: {
      userId,
      type: type as string,
    },
  });

  return redirect("/");
}
