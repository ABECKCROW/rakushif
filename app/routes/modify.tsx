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
  Select,
  VStack,
  useToast,
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
    date: "", // No default value
    time: "", // No default value
    type: "", // No default value
  });

  // Initialize toast
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check if all fields are filled
  const isFormValid = formData.date !== "" && formData.time !== "" && formData.type !== "";

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
          <Heading as="h1" size="xl">打刻修正</Heading>
          <Link to="/">
            <Button 
              size="sm" 
              colorScheme="whiteAlpha"
              _active={{
                transform: 'scale(0.95)',
                transition: 'transform 0.1s'
              }}
            >
              ホームに戻る
            </Button>
          </Link>
        </Box>

        <Box p={6} borderRadius="lg">
          <Form method="post" onSubmit={() => {
            // Get the translated type for display
            const typeText = translateType(formData.type);
            // Format the date for display
            const dateObj = new Date(formData.date);
            const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;

            toast({
              title: "打刻修正を記録しました",
              description: `${formattedDate} ${formData.time} - ${typeText}`,
              status: "success",
              duration: 3000,
              isClosable: true,
              position: "top"
            });

            // Reset form after submission
            setTimeout(() => {
              setFormData({
                date: "",
                time: "",
                type: "",
              });
            }, 100);
          }}>
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

              <Button
                type="submit"
                colorScheme="blue"
                mt={4}
                width="100%"
                maxW="300px"
                isDisabled={!isFormValid}
                _active={{
                  transform: 'scale(0.95)',
                  transition: 'transform 0.1s'
                }}
              >
                打刻修正
              </Button>
            </VStack>
          </Form>
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
