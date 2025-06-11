import { LoaderFunction } from "@remix-run/node";
import { useLoaderData, Form } from '@remix-run/react';
import prisma from '~/.server/db/client';
import { requireUserId } from "~/utils/session.server";
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
} from '@chakra-ui/react';
import { Header } from '~/components/Header';
import { HomeButton } from '~/components/HomeButton';

export const loader: LoaderFunction = async ({ request }) => {
  // Get the user ID from the session
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return { user };
};

export default function Account() {
  const { user } = useLoaderData<{ user: { id: number, name: string, email: string } | null }>();

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

            <Text fontSize="sm" color="gray.500">
              ※ 現在のバージョンでは、アカウント情報の編集機能は実装されていません。
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
