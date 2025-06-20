import { Box, Container, FormControl, FormLabel, Select, useToast, VStack } from '@chakra-ui/react';
import { ActionFunctionArgs, json, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import prisma from "~/.server/db/client";
import { RecordType } from "@prisma/client";
import { requireUserId } from "~/utils/session.server";
import { FormButton, Header, HomeButton, DateSelector, TimeSelector, LoadingOverlay } from '~/components';

// Define the type for the action response
type ActionResponse = {
  success: boolean;
  date: string;
  time: string;
  type: string;
  error?: string;
};

// Define the type for the form data
type RecordFormData = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  type: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  // Require a user to be logged in
  await requireUserId(request);

  // Define the record types
  const recordTypes: RecordType[] = ["START_WORK", "END_WORK", "START_BREAK", "END_BREAK"];

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
  const fetcher = useFetcher<ActionResponse>();
  const isSubmitting = fetcher.state === "submitting";

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
          <LoadingOverlay 
            isLoading={isSubmitting} 
            text="打刻修正を記録中..."
          >
            <fetcher.Form method="post">
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>日付:</FormLabel>
                  <Box width="100%" maxW="300px">
                    <DateSelector
                      year={formData.year}
                      month={formData.month}
                      day={formData.day}
                      onYearChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                      onMonthChange={(value) => setFormData(prev => ({ ...prev, month: value }))}
                      onDayChange={(value) => setFormData(prev => ({ ...prev, day: value }))}
                      isDisabled={isSubmitting}
                    />
                    <input type="hidden" name="year" value={formData.year} />
                    <input type="hidden" name="month" value={formData.month} />
                    <input type="hidden" name="day" value={formData.day} />
                  </Box>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>時刻:</FormLabel>
                  <Box width="100%" maxW="300px">
                    <TimeSelector
                      hour={formData.hour}
                      minute={formData.minute}
                      onHourChange={(value) => setFormData(prev => ({ ...prev, hour: value }))}
                      onMinuteChange={(value) => setFormData(prev => ({ ...prev, minute: value }))}
                      isDisabled={isSubmitting}
                    />
                    <input type="hidden" name="hour" value={formData.hour} />
                    <input type="hidden" name="minute" value={formData.minute} />
                  </Box>
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
                    isDisabled={isSubmitting}
                  >
                    {recordTypes.map((type: RecordType) => (
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
                  isDisabled={!isFormValid || isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="記録中..."
                >
                  打刻修正
                </FormButton>
              </VStack>
            </fetcher.Form>
          </LoadingOverlay>
        </Box>

      </VStack>
      <Box justify-content="center" width="100%" mt={4}>
        <HomeButton size="sm" isDisabled={isSubmitting} />
      </Box>
    </Container>
  );
}

// Helper function to translate record types to Japanese
function translateType(type: string | RecordType): string {
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
      // If it's not one of the known types, it must be a string
      return typeof type === "string" ? type : String(type);
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const year = formData.get("year");
  const month = formData.get("month");
  const day = formData.get("day");
  const hour = formData.get("hour");
  const minute = formData.get("minute");
  const type = formData.get("type");

  // Check if all values are strings and not null
  if (
    typeof year !== "string" || 
    typeof month !== "string" || 
    typeof day !== "string" || 
    typeof hour !== "string" || 
    typeof minute !== "string" || 
    typeof type !== "string" ||
    !year || !month || !day || !hour || !minute || !type
  ) {
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

  // Validate that type is a valid RecordType
  const isValidRecordType = (value: string): value is RecordType => {
    return value === "START_WORK" || 
           value === "END_WORK" || 
           value === "START_BREAK" || 
           value === "END_BREAK";
  };

  if (!isValidRecordType(type)) {
    return json({ error: "Invalid record type" }, { status: 400 });
  }

  // Get the user ID from the session
  const userId = await requireUserId(request);

  // Create a new record with the isModified flag set to true
  await prisma.record.create({
    data: {
      userId,
      type, // Now type is guaranteed to be RecordType
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
