import { ActionFunctionArgs, LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useFetcher } from '@remix-run/react';
import React, { useEffect, useState } from 'react';
import prisma from '~/.server/db/client';
import { 
  Box, 
  Container,
  HStack, 
  Text, 
  VStack,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure
} from '@chakra-ui/react';
import { 
  Header, 
  LinkButton,
  AttendanceButton,
} from '~/components';

// ステータスの種類
type Status = 'WORKING' | 'ON_BREAK' | 'NOT_WORKING';

// ステータスの日本語表示
const statusText = {
  WORKING: '勤務中',
  ON_BREAK: '休憩中',
  NOT_WORKING: '勤務していません'
};

// 直前の打刻を消せる時間制限（分）
// 将来的に変更できるようにするため、定数として定義
const RECORD_DELETION_TIME_LIMIT_MINUTES = 5;

export const loader: LoaderFunction = async () => {
  // ユーザー情報を取得 (現在は固定のユーザーID=1を使用)
  const userId = 1;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // 最新の記録を取得 (論理削除されていないもののみ)
  const latestRecord = await prisma.record.findFirst({
    where: { 
      userId,
      isDeleted: false 
    },
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
      isDeleted: false,
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
  const fetcher = useFetcher();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [recordToDelete, setRecordToDelete] = useState<{id: number, type: string, timestamp: string} | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

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

  // Find the most recent record (non-deleted)
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestRecord = sortedRecords.find(record => !record.isDeleted);

  // Check if a record is within the deletion time window
  const isWithinDeletionWindow = (timestamp: string) => {
    const now = new Date();
    const recordTime = new Date(timestamp);
    const timeDifferenceInMinutes = (now.getTime() - recordTime.getTime()) / (1000 * 60);
    return timeDifferenceInMinutes <= RECORD_DELETION_TIME_LIMIT_MINUTES;
  };

  // Handle delete button click
  const handleDeleteClick = (record: any) => {
    setRecordToDelete({
      id: record.id,
      type: record.type,
      timestamp: record.timestamp
    });
    onOpen();
  };

  // Handle confirmation dialog confirm
  const handleDeleteConfirm = () => {
    if (recordToDelete) {
      const formData = new FormData();
      formData.append("action", "deleteRecord");
      formData.append("recordId", recordToDelete.id.toString());
      fetcher.submit(formData, { method: "post" });
    }
    onClose();
  };

  return (
    <>
      <VStack spacing={1} width="100%" fontSize="xs" mt={2}>
        {records.map((record, index) => {
          // Check if this record is the latest and within the deletion window
          const isLatest = latestRecord && record.id === latestRecord.id;
          const canDelete = isLatest && isWithinDeletionWindow(record.timestamp);

          return (
            <HStack key={index} width="100%" justifyContent="center" spacing={4} position="relative">
              <Box width="20px" textAlign="center">
                {record.isDeleted && <Text color="red.500" fontWeight="bold">✕</Text>}
              </Box>
              <Text fontWeight="bold" textAlign="left" width="80px">{recordTypeText[record.type as keyof typeof recordTypeText]}:</Text>
              <Text>{formatTime(record.timestamp)}</Text>
              <Box width="40px" ml={2}>
                {!record.isDeleted && canDelete && (
                  <Text 
                    color="blue.500"
                    textDecoration="underline"
                    cursor="pointer"
                    onClick={() => handleDeleteClick(record)}
                    fontSize="0.8em"
                  >
                    削除
                  </Text>
                )}
              </Box>
            </HStack>
          );
        })}
      </VStack>

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent marginTop="40vh">
            <AlertDialogHeader mt={5} fontSize="lg" fontWeight="bold">
              {recordToDelete ? `${recordTypeText[recordToDelete.type as keyof typeof recordTypeText]}: ${formatTime(recordToDelete.timestamp)} を削除しますか？` : '記録を削除'}
            </AlertDialogHeader>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                キャンセル
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                削除
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
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

  // Initialize toast and fetcher
  const toast = useToast();
  const fetcher = useFetcher();

  // Show toast when fetcher submission is successful
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const type = fetcher.data.type;

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

      if (title) {
        toast({
          title: title,
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top"
        });
      }
    }
  }, [fetcher.state, fetcher.data, toast]);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="出退勤打刻">
          {user && (
            <HStack spacing={2}>
              <LinkButton 
                to="/account" 
                size="sm" 
                colorScheme="whiteAlpha"
              >
                {user.name}
              </LinkButton>
            </HStack>
          )}
        </Header>

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

            <fetcher.Form method="post" width="100%">
              <input type="hidden" name="action" value="createRecord" />
              <VStack spacing={4} width="100%">
                {status === 'NOT_WORKING' && (
                  <AttendanceButton 
                    name="type" 
                    value="START_WORK"
                    colorScheme="blue"
                  >
                    出勤
                  </AttendanceButton>
                )}

                {status === 'WORKING' && (
                  <>
                    <AttendanceButton 
                      name="type" 
                      value="END_WORK"
                      colorScheme="red"
                    >
                      退勤
                    </AttendanceButton>
                    <AttendanceButton 
                      name="type" 
                      value="START_BREAK"
                      colorScheme="orange"
                    >
                      休憩開始
                    </AttendanceButton>
                  </>
                )}

                {status === 'ON_BREAK' && (
                  <AttendanceButton 
                    name="type" 
                    value="END_BREAK"
                    colorScheme="green"
                  >
                    休憩終了
                  </AttendanceButton>
                )}
              </VStack>
            </fetcher.Form>

            <HStack justifyContent="center" spacing={4} mt={4} width="100%">
              <LinkButton 
                to="/records" 
                colorScheme="blue" 
                flex={1}
                minWidth="150px"
                fontSize="md"
                whiteSpace="nowrap"
              >
                記録一覧を見る
              </LinkButton>
              <LinkButton 
                to="/modify" 
                colorScheme="teal" 
                flex={1}
                minWidth="150px"
                fontSize="md"
                whiteSpace="nowrap"
              >
                打刻修正
              </LinkButton>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const action = form.get("action");

  // 現在は固定のユーザーID=1を使用
  const userId = 1;

  // Handle record deletion
  if (action === "deleteRecord") {
    const recordId = form.get("recordId");
    if (!recordId) {
      return new Response("Record ID is required", { status: 400 });
    }

    // Get the record to be deleted
    const recordToDelete = await prisma.record.findUnique({
      where: { id: Number(recordId) },
    });

    if (!recordToDelete) {
      return new Response("Record not found", { status: 404 });
    }

    // Get the most recent record for the user
    const latestRecord = await prisma.record.findFirst({
      where: { 
        userId,
        isDeleted: false 
      },
      orderBy: { timestamp: 'desc' },
    });

    // Check if the record to be deleted is the most recent one
    if (!latestRecord || latestRecord.id !== recordToDelete.id) {
      return new Response("Only the most recent record can be deleted", { status: 403 });
    }

    // Check if the record was created within the deletion time window
    const now = new Date();
    const recordTime = new Date(recordToDelete.timestamp);
    const timeDifferenceInMinutes = (now.getTime() - recordTime.getTime()) / (1000 * 60);

    if (timeDifferenceInMinutes > RECORD_DELETION_TIME_LIMIT_MINUTES) {
      return new Response(`Records can only be deleted within ${RECORD_DELETION_TIME_LIMIT_MINUTES} minutes of creation`, { status: 403 });
    }

    // If all checks pass, mark the record as deleted
    await prisma.record.update({
      where: { id: Number(recordId) },
      data: { isDeleted: true },
    });

    return json({ success: true });
  }

  // Handle record creation
  if (action === "createRecord") {
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
        userId,
        type: type as string,
      },
    });

    // Return the type in the response data for the fetcher
    return json({ type });
  }

  return new Response("Invalid action", { status: 400 });
}
