import { LoaderFunction, ActionFunction, json, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import React from 'react';
import prisma from '~/.server/db/client';
import { requireUserId } from "~/utils/session.server";
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  Box,
  Button,
  Container,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Divider, 
  Heading,
  Avatar,
  Center,
  useToast,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Header } from '~/components/Header';
import { HomeButton } from '~/components/HomeButton';

export const loader: LoaderFunction = async ({ request }) => {
  // Get the user ID from the session
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  return { user };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  // Check if the avatars directory exists, if not create it
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  try {
    await fs.access(avatarsDir);
  } catch (error) {
    await fs.mkdir(avatarsDir, { recursive: true });
  }

  // Parse the multipart form data (for file uploads)
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 5_000_000, // 5MB limit
  });
  const formData = await unstable_parseMultipartFormData(request, uploadHandler);

  // Check if a file was uploaded
  const avatarFile = formData.get("avatarFile");

  try {
    if (avatarFile instanceof File && avatarFile.size > 0) {
      // Handle file upload
      const fileExtension = avatarFile.name.split('.').pop() || 'jpg';
      const fileName = `avatar-${userId}-${Date.now()}.${fileExtension}`;
      const filePath = path.join(avatarsDir, fileName);

      // Read the file as an ArrayBuffer
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Write the file to disk
      await fs.writeFile(filePath, buffer);

      // Update the user's avatarUrl to point to the uploaded file
      const publicPath = `/avatars/${fileName}`;
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: publicPath },
      });

      return json({ success: true });
    } else {
      return json({ error: "No avatar file provided" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating avatar:", error);
    return json({ error: "Failed to update avatar" }, { status: 500 });
  }
};

export default function Account() {
  const { user } = useLoaderData<{ user: { id: number, name: string, email: string, avatarUrl?: string } | null }>();
  const actionData = useActionData<{ error?: string, success?: boolean }>();
  const toast = useToast();

  // Show toast on successful update
  React.useEffect(() => {
    if (actionData?.success) {
      toast({
        title: "プロフィール画像が更新されました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [actionData, toast]);

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="stretch">
          <Header title="アカウント情報">
            <HomeButton size="sm" colorScheme="whiteAlpha" />
          </Header>
          <Text>ユーザー情報が見つかりませんでした。</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="アカウント情報" />

        <Box p={6} borderRadius="lg">
          <VStack spacing={4} align="stretch">
            <Center mb={4}>
              <Avatar 
                size="2xl" 
                name={user.name} 
                src={user.avatarUrl || undefined} 
                mb={2}
              />
            </Center>

            <Heading as="h2" size="md">ユーザー情報</Heading>
            <Divider />

            <FormControl>
              <FormLabel>ユーザーID</FormLabel>
              <Input value={user.id} isReadOnly />
            </FormControl>

            <FormControl>
              <FormLabel>名前</FormLabel>
              <Input value={user.name} isReadOnly />
            </FormControl>

            <FormControl>
              <FormLabel>メールアドレス</FormLabel>
              <Input value={user.email} isReadOnly />
            </FormControl>

            <Form method="post" encType="multipart/form-data">
              <FormControl isInvalid={!!actionData?.error}>
                <FormLabel>プロフィール画像をアップロード</FormLabel>
                <Input 
                  type="file" 
                  name="avatarFile" 
                  accept="image/*"
                  py={1}
                />
                {actionData?.error && (
                  <FormErrorMessage>{actionData.error}</FormErrorMessage>
                )}
                <Text fontSize="xs" color="gray.500" mt={1}>
                  ※ JPG, PNG, GIF などの画像ファイルをアップロードできます。
                </Text>
              </FormControl>

              <Button type="submit" colorScheme="blue" mt={4} width="100%">
                プロフィール画像を更新
              </Button>
            </Form>

            <Text fontSize="sm" color="gray.500">
              ※ 現在のバージョンでは、名前とメールアドレスの編集機能は実装されていません。
            </Text>

            <Divider my={4} />

            <Form action="/logout" method="post">
              <Button type="submit" colorScheme="red" width="100%">
                ログアウト
              </Button>
            </Form>
          </VStack>
        </Box>

        <HomeButton />
      </VStack>
    </Container>
  );
}
