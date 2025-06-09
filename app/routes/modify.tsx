import { Box, Container, FormControl, FormLabel, Input, Select, useToast, VStack } from '@chakra-ui/react';
import { ActionFunctionArgs, json, LoaderFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import prisma from "~/.server/db/client";
import { FormButton, Header, HomeButton } from '~/components';

// Define the type for the form data
type RecordFormData = {
  date: string;
  time: string;
  type: string;
};

export const loader: LoaderFunction = async () => {
  // Define the record types
  const recordTypes = ["START_WORK", "END_WORK", "START_BREAK", "END_BREAK"];

  return json({ recordTypes });
};

export default function ModifyRecord() {
  const { recordTypes } = useLoaderData<typeof loader>();
  const [formData, setFormData] = useState<RecordFormData>({
    date: "", // No default value
    time: "", // No default value
    type: "", // No default value
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
      setFormData({
        date: "",
        time: "",
        type: "",
      });
    }
  }, [fetcher.state, fetcher.data, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check if all fields are filled
  const isFormValid = formData.date !== "" && formData.time !== "" && formData.type !== "";

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="打刻修正" />

        <Box p={6} borderRadius="lg">
          <fetcher.Form method="post">
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel htmlFor="date">日付:</FormLabel>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  width="100%"
                  maxW="300px"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="time">時刻:</FormLabel>
                <Input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  width="100%"
                  maxW="300px"
                />
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
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const type = formData.get("type") as string;

  if (!date || !time || !type) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  // Combine date and time to create a timestamp
  // Explicitly create a date in local time (JST)
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const timestamp = new Date(year, month - 1, day, hours, minutes, 0);

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
