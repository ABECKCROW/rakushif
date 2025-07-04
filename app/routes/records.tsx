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
import { useEffect, useState } from "react";
import prisma from '~/.server/db/client';
import { requireUserId } from "~/utils/session.server";
import { ActionButton, FormButton, Header, HomeButton, DateSelector, LoadingOverlay } from '~/components';
import { useDateRange } from "~/hooks/useDateRange";
import { calculateDailyData, getDateRangeString, groupRecordsByDate } from "~/utils/recordUtils";

export const loader = async ({ request }: { request: Request }) => {
  // Get the user ID from the session
  const userId = await requireUserId(request);

  // URLからクエリパラメータを取得
  const url = new URL(request.url);
  let from, to;

  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  if (fromParam && toParam) {
    from = new Date(fromParam);
    to = new Date(toParam);

    // 終了日の時間を23:59:59に設定して、その日全体を含める
    to.setHours(23, 59, 59, 999);
  } else {
    // 現在の月の範囲を取得
    const now = new Date();
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // レコードを取得 (論理削除されていないもののみ)
  const records = await prisma.record.findMany({
    where: {
      userId,
      timestamp: { gte: from, lte: to },
      isDeleted: false,
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
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [isUpdatingDateRange, setIsUpdatingDateRange] = useState(false);

  // 日付範囲の状態管理にカスタムフックを使用
  const {
    startDate,
    endDate,
    startYear,
    startMonth,
    startDay,
    endYear,
    setEndYear,
    endMonth,
    setEndMonth,
    endDay,
    setEndDay,
    updateStartDate,
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
                setIsUpdatingDateRange(true);

                // Get the form values for navigation
                const formData = new FormData(e.currentTarget);
                const from = formData.get("from");
                const to = formData.get("to");

                // Validate that from and to are strings
                if (typeof from !== "string" || typeof to !== "string") {
                  console.error("Form values are not valid strings");
                  setIsUpdatingDateRange(false);
                  return;
                }

                // Navigate to the new URL with a showToast parameter
                window.location.href = `/records?from=${from}&to=${to}&showToast=true`;
              }}
            >
              <Flex gap={6} alignItems="center" flexWrap="wrap" py={4}>
                <FormControl w="auto">
                  <FormLabel fontSize="lg">開始日:</FormLabel>
                  <Box>
                    <DateSelector
                      year={startYear}
                      month={startMonth}
                      day={startDay}
                      onYearChange={(value) => updateStartDate(value, startMonth, startDay)}
                      onMonthChange={(value) => updateStartDate(startYear, value, startDay)}
                      onDayChange={(value) => updateStartDate(startYear, startMonth, value)}
                      size="lg"
                    />
                    <Input
                      type="hidden"
                      id="from"
                      name="from"
                      value={startDate}
                    />
                  </Box>
                </FormControl>
                <FormControl w="auto">
                  <FormLabel fontSize="lg">終了日:</FormLabel>
                  <Box>
                    <DateSelector
                      year={endYear}
                      month={endMonth}
                      day={endDay}
                      onYearChange={setEndYear}
                      onMonthChange={setEndMonth}
                      onDayChange={setEndDay}
                      size="lg"
                    />
                    <Input
                      type="hidden"
                      id="to"
                      name="to"
                      value={endDate}
                    />
                  </Box>
                </FormControl>

                <FormButton
                  colorScheme="blue"
                  mt={8}
                  size="lg"
                  h="50px"
                  px={6}
                  fontSize="lg"
                  isLoading={isUpdatingDateRange}
                  loadingText="更新中..."
                  isDisabled={isUpdatingDateRange || isDownloadingCsv}
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
                    isLoading={isDownloadingCsv}
                    loadingText="ダウンロード中..."
                    isDisabled={isDownloadingCsv}
                    toastOptions={{
                      title: "CSVをダウンロードしました",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                      position: "top",
                    }}
                    actionFn={() => {
                      setIsDownloadingCsv(true);
                      // Use setTimeout to allow the loading state to be shown before the download starts
                      setTimeout(() => {
                        window.location.href = getCsvUrl();
                        // Reset loading state after a short delay to ensure the loading state is visible
                        setTimeout(() => {
                          setIsDownloadingCsv(false);
                        }, 1000);
                      }, 500);
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
                    <Td whiteSpace="nowrap" fontSize="lg" p={4} color={day.isStartTimeModified ? "red.500" : "inherit"}>{day.startTime}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4} color={day.isEndTimeModified ? "red.500" : "inherit"}>{day.endTime}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4}>{day.workHours}</Td>
                    <Td whiteSpace="nowrap" fontSize="lg" p={4} color={day.isBreakTimeModified ? "red.500" : "inherit"}>{day.breakTime}</Td>
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
        <HomeButton size="sm" isDisabled={isDownloadingCsv || isUpdatingDateRange} />
      </Box>

    </Container>
  );
};


export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const actionValue = formData.get("action");

  // Validate that action is a string
  if (typeof actionValue !== "string") {
    return json({ error: "Action is required" }, { status: 400 });
  }

  if (actionValue === "update") {
    const from = formData.get("from");
    const to = formData.get("to");

    // Validate that from and to are strings
    if (typeof from !== "string" || typeof to !== "string") {
      return json({ error: "From and to dates are required" }, { status: 400 });
    }

    // Redirect to the same page with the new date range
    return json({ action: actionValue, from, to });
  } else if (actionValue === "csv") {
    // Return success for CSV download
    return json({ action: actionValue });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default RecordsPage;
