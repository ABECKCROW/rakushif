import { Link, useLoaderData } from "@remix-run/react";
import prisma from '~/.server/db/client';
import { useDateRange } from "~/hooks/useDateRange";
import {
  calculateDailyData,
  getDateRangeString,
  groupRecordsByDate,
  HOURLY_RATE,
} from "~/utils/recordUtils";
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link as ChakraLink,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
} from '@chakra-ui/react';

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


  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <ChakraLink as={Link} to="/" color="blue.500" mb={4} display="inline-block">
            ルートに戻る
          </ChakraLink>
          <Heading as="h1" size="xl" mt={2}>勤怠記録</Heading>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={4}>期間選択</Heading>
          <Box as="form" method="get" action="/records">
            <Flex gap={4} alignItems="center" flexWrap="wrap">
              <FormControl w="auto">
                <FormLabel htmlFor="from">開始日:</FormLabel>
                <Input
                  id="from"
                  type="date"
                  name="from"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormControl>
              <FormControl w="auto">
                <FormLabel htmlFor="to">終了日:</FormLabel>
                <Input
                  id="to"
                  type="date"
                  name="to"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" mt={8}>
                表示更新
              </Button>
            </Flex>
          </Box>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={2}>月別サマリー</Heading>
          <Text mb={4}>
            ユーザー: {data.userName} / 月: {data.monthStr} / 時給: {HOURLY_RATE.toLocaleString()}円
          </Text>

          <Box overflowX="auto">
            <Table variant="simple" size="md" borderWidth="1px">
              <Thead>
                <Tr bg="red.500">
                  <Th color="white">日付</Th>
                  <Th color="white">出勤時刻</Th>
                  <Th color="white">退勤時刻</Th>
                  <Th color="white">労働時間</Th>
                  <Th color="white">休憩時間</Th>
                  <Th color="white">日給</Th>
                  <Th color="white">備考</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.dailyData.map((day, index) => (
                  <Tr key={index}>
                    <Td>{day.dateStr}</Td>
                    <Td>{day.startTime}</Td>
                    <Td>{day.endTime}</Td>
                    <Td>{day.workHours}</Td>
                    <Td>{day.breakTime}</Td>
                    <Td>{day.dailyWage ? `${day.dailyWage.toLocaleString()}円` : ""}</Td>
                    <Td>{day.notes}</Td>
                  </Tr>
                ))}
                <Tr fontWeight="bold" bg="red.500">
                  <Td colSpan={4}></Td>
                  <Td color="white">月給合計</Td>
                  <Td color="white">{data.monthlyTotal.toLocaleString()}円</Td>
                  <Td></Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        </Box>

        <Box mt={6}>
          <ChakraLink as={Link} to={getCsvUrl()} reloadDocument color="blue.500">
            📥 CSVをダウンロード
          </ChakraLink>
        </Box>
      </VStack>
    </Container>
  );
};


export default RecordsPage;
