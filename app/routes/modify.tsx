import { ActionFunctionArgs, LoaderFunction, json } from "@remix-run/node";
import { Form, useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import prisma from "~/.server/db/client";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link as ChakraLink,
  Select,
  VStack,
} from '@chakra-ui/react';

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
    date: new Date().toISOString().split("T")[0], // Default to today
    time: new Date().toTimeString().split(" ")[0].substring(0, 5), // Default to current time (HH:MM)
    type: "START_WORK", // Default type
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <ChakraLink as={Link} to="/" color="blue.500" mb={4} display="inline-block">
            ルートに戻る
          </ChakraLink>
          <Heading as="h1" size="xl" mt={2}>打刻修正</Heading>
        </Box>

        <Box as={Form} method="post">
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
              >
                {recordTypes.map((type) => (
                  <option key={type} value={type}>
                    {translateType(type)}
                  </option>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              mt={4}
              width="100%"
              maxW="300px"
            >
              打刻修正
            </Button>
          </VStack>
        </Box>
      </VStack>
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

  return json({ success: true });
}
