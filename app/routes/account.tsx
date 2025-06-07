import { LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from '@remix-run/react';
import prisma from '~/.server/db/client';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Divider
} from '@chakra-ui/react';

export const loader: LoaderFunction = async () => {
  // ユーザー情報を取得 (現在は固定のユーザーID=1を使用)
  const userId = 1;
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
            <Heading as="h1" size="xl">アカウント情報</Heading>
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
          <Text>ユーザー情報が見つかりませんでした。</Text>
        </VStack>
      </Container>
    );
  }

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
          <Heading as="h1" size="xl">アカウント情報</Heading>
        </Box>

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
          </VStack>
        </Box>

        <Link to="/">
          <Button 
            colorScheme="blue"
            _active={{
              transform: 'scale(0.95)',
              transition: 'transform 0.1s'
            }}
          >
            ホームに戻る
          </Button>
        </Link>
      </VStack>
    </Container>
  );
}
