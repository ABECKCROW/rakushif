import {
  Box,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { ActionFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect } from "react";
import prisma from '~/.server/db/client';
import { ActionButton, FormButton, Header, HomeButton } from '~/components';
import { useDateRange } from "~/hooks/useDateRange";
import { calculateDailyData, getDateRangeString, groupRecordsByDate } from "~/utils/recordUtils";

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
  const [searchParams] = useSearchParams();

  // 日付範囲の状態管理にカスタムフックを使用
  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    getCsvUrl,
  } = useDateRange(data.from, data.to);

  // Initialize toast and fetcher
  const toast = useToast();
  const fetcher = useFetcher();

  // We're now showing toasts directly in the click handlers, so we don't need this effect anymore

  // Legacy toast for URL parameter (can be removed once all links are updated)
  useEffect(() => {
    if (searchParams.get("showToast") === "true") {
      toast({
        title: "表示を更新しました",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }

    // More robust blur mechanism that runs multiple times
    const blurActiveElement = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    // Blur immediately
    blurActiveElement();

    // Blur again after a short delay to catch any elements that might get focused later
    const timeoutIds = [
      setTimeout(blurActiveElement, 100),
      setTimeout(blurActiveElement, 300),
      setTimeout(blurActiveElement, 500),
    ];

    return () => {
      // Clean up timeouts
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [searchParams, toast]);


  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="勤怠記録" />
        <Box>
          <Heading as="h2" size="lg" mb={4}>期間選択</Heading>
          <Box
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            bg="white"
          >
            <fetcher.Form
              method="post"
              onSubmit={(e) => {
                e.preventDefault(); // Prevent default form submission first

                // Get the form values for navigation
                const formData = new FormData(e.currentTarget);
                const from = formData.get("from") as string;
                const to = formData.get("to") as string;

                // Navigate to the new URL with a showToast parameter
                window.location.href = `/records?from=${from}&to=${to}&showToast=true`;
              }}
            >
              <Flex gap={6} alignItems="center" flexWrap="wrap" py={4}>
                <FormControl w="auto">
                  <FormLabel htmlFor="from" fontSize="lg">開始日:</FormLabel>
                  <Input
                    id="from"
                    type="date"
                    name="from"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    whiteSpace="nowrap"
                    size="lg"
                    h="50px"
                    fontSize="lg"
                  />
                </FormControl>
                <FormControl w="auto">
                  <FormLabel htmlFor="to" fontSize="lg">終了日:</FormLabel>
                  <Input
                    id="to"
                    type="date"
                    name="to"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    whiteSpace="nowrap"
                    size="lg"
                    h="50px"
                    fontSize="lg"
                  />
                </FormControl>

                <FormButton
                  colorScheme="blue"
                  mt={8}
                  size="lg"
                  h="50px"
                  px={6}
                  fontSize="lg"
                >
                  更新
                </FormButton>
                <ActionButton
                  size="lg"
                  h="50px"
                  px={6}
                  mt={8}
                  fontSize="lg"
                  showToast={true}
                  toastOptions={{
                    title: "CSVをダウンロードしました",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "top",
                  }}
                  actionFn={() => {
                    window.location.href = getCsvUrl();
                  }}
                >
                  📥 CSV
                </ActionButton>
              </Flex>
            </fetcher.Form>
          </Box>
        </Box>

        <Box>
          <Heading as="h2" size="lg" mb={2}>月別サマリー</Heading>
          <Box overflowX="auto">
            <Table variant="simple" size="lg">
              <Thead>
                <Tr bg="red.300">
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>日付</Th>
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>出勤時刻</Th>
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>退勤時刻</Th>
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>労働時間</Th>
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>休憩時間</Th>
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>日給</Th>
                  <Th color="white" whiteSpace="nowrap" fontSize="lg" p={4}>備考</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.dailyData.map((day, index) => (
                  <Tr key={index}>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.dateStr}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.startTime}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.endTime}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.workHours}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.breakTime}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg"
                        p={4}>{day.dailyWage ? `${day.dailyWage.toLocaleString()}円` : ""}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.notes}</Td>
                  </Tr>
                ))}
                <Tr fontWeight="bold" bg="red.300">
                  <Td colSpan={4} p={4}></Td>
                  <Td color="white" whiteSpace="nowrap" fontSize="lg" p={4}>月給合計</Td>
                  <Td color="white" whiteSpace="nowrap" fontSize="lg" p={4}>{data.monthlyTotal.toLocaleString()}円</Td>
                  <Td p={4}></Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>
      <Box width="100%" mt={4}>
        <HomeButton size="sm" />
      </Box>

    </Container>
  );
};


export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "update") {
    const from = formData.get("from") as string;
    const to = formData.get("to") as string;

    // Redirect to the same page with the new date range
    return json({ action, from, to });
  } else if (action === "csv") {
    // Return success for CSV download
    return json({ action });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default RecordsPage;
