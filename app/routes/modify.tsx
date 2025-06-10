import { Box, Container, FormControl, FormLabel, Input, Select, useToast, VStack, HStack, Text } from '@chakra-ui/react';
import { ActionFunctionArgs, json, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import prisma from "~/.server/db/client";
import { FormButton, Header, HomeButton } from '~/components';

// Define the type for the form data
type RecordFormData = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  type: string;
};

export const loader: LoaderFunction = async () => {
  // Define the record types
  const recordTypes = ["START_WORK", "END_WORK", "START_BREAK", "END_BREAK"];

  return json({ recordTypes });
};

export default function ModifyRecord() {
  const { recordTypes } = useLoaderData<typeof loader>();

  // Get current date and time for default values
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const currentDay = now.getDate().toString().padStart(2, '0');
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');

  const [formData, setFormData] = useState<RecordFormData>({
    year: currentYear,
    month: currentMonth,
    day: currentDay,
    hour: currentHour,
    minute: currentMinute,
    type: "",
  });

  // Initialize toast and fetcher
  const toast = useToast();
  const fetcher = useFetcher();

  // Show toast when fetcher submission is successful
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data && fetcher.data.success) {
      // Get the translated type for display
      const typeText = translateType(fetcher.data.type);
      // Format the date for display
      const dateObj = new Date(fetcher.data.date);
      const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;

      toast({
        title: "打刻修正を記録しました",
        description: `${formattedDate} ${fetcher.data.time} - ${typeText}`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      // Reset form after submission
      // Get current date and time for default values
      const now = new Date();
      setFormData({
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        day: now.getDate().toString().padStart(2, '0'),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: now.getMinutes().toString().padStart(2, '0'),
        type: "",
      });
    }
  }, [fetcher.state, fetcher.data, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check if all fields are filled
  const isFormValid = formData.year !== "" && formData.month !== "" && formData.day !== "" && 
                     formData.hour !== "" && formData.minute !== "" && formData.type !== "";

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="打刻修正" />

        <Box p={6} borderRadius="lg">
          <fetcher.Form method="post">
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>日付:</FormLabel>
                <HStack spacing={2} width="100%" maxW="300px">
                  <Select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    width="40%"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year.toString()}>
                          {year}年
                        </option>
                      );
                    })}
                  </Select>
                  <Select
                    id="month"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    width="30%"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={month} value={month}>
                          {i + 1}月
                        </option>
                      );
                    })}
                  </Select>
                  <Select
                    id="day"
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                    width="30%"
                  >
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={day} value={day}>
                          {i + 1}日
                        </option>
                      );
                    })}
                  </Select>
                </HStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>時刻:</FormLabel>
                <HStack spacing={2} width="100%" maxW="300px">
                  <Select
                    id="hour"
                    name="hour"
                    value={formData.hour}
                    onChange={handleChange}
                    width="50%"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <option key={hour} value={hour}>
                          {hour}時
                        </option>
                      );
                    })}
                  </Select>
                  <Select
                    id="minute"
                    name="minute"
                    value={formData.minute}
                    onChange={handleChange}
                    width="50%"
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const minute = i.toString().padStart(2, '0');
                      return (
                        <option key={minute} value={minute}>
                          {minute}分
                        </option>
                      );
                    })}
                  </Select>
                </HStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="type">記録種別:</FormLabel>
                <Select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  width="100%"
                  maxW="300px"
                  placeholder="選択してください"
                >
                  {recordTypes.map((type) => (
                    <option key={type} value={type}>
                      {translateType(type)}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormButton
                colorScheme="blue"
                mt={4}
                width="100%"
                maxW="300px"
                isDisabled={!isFormValid}
              >
                打刻修正
              </FormButton>
            </VStack>
          </fetcher.Form>

        </Box>

      </VStack>
      <Box justify-content="center" width="100%" mt={4}>
        <HomeButton size="sm" />
      </Box>
    </Container>
  );
}

// Helper function to translate record types to Japanese
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

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const year = formData.get("year") as string;
  const month = formData.get("month") as string;
  const day = formData.get("day") as string;
  const hour = formData.get("hour") as string;
  const minute = formData.get("minute") as string;
  const type = formData.get("type") as string;

  if (!year || !month || !day || !hour || !minute || !type) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  // Format date string for display (YYYY-MM-DD)
  const date = `${year}-${month}-${day}`;
  // Format time string for display (HH:MM)
  const time = `${hour}:${minute}`;

  // Combine date and time to create a timestamp
  // Explicitly create a date in local time (JST)
  const timestamp = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    0
  );

  // Create a new record with the isModified flag set to true
  await prisma.record.create({
    data: {
      userId: 1, // Default user ID
      type: type as any, // Cast to RecordType
      timestamp,
      isModified: true,
    },
  });

  // Return the form data in the response for the fetcher
  return json({
    success: true,
    date,
    time,
    type,
  });
}
