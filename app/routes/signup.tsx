import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  FormErrorMessage,
  useToast,
} from "@chakra-ui/react";
import { getUser, hashPassword } from "~/utils/session.server";
import { Header } from "~/components";
import prisma from "~/.server/db/client";

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already logged in, redirect to the home page
  const user = await getUser(request);
  if (user) return redirect("/");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  // Validate form data
  const errors = {
    name: name ? null : "名前を入力してください",
    email: email ? null : "メールアドレスを入力してください",
    password: null,
    confirmPassword: null,
  };

  if (typeof name !== "string" || !name) {
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  if (typeof email !== "string" || !email) {
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  if (typeof password !== "string" || !password) {
    errors.password = "パスワードを入力してください";
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  if (password.length < 8) {
    errors.password = "パスワードは8文字以上で入力してください";
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  // Check if password contains at least one uppercase letter and one special character
  if (!/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    errors.password = "パスワードには大文字と記号を含める必要があります";
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  if (typeof confirmPassword !== "string" || !confirmPassword) {
    errors.confirmPassword = "パスワード（確認）を入力してください";
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "パスワードが一致しません";
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  // Check if user with the same email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    errors.email = "このメールアドレスは既に登録されています";
    return json({ errors, values: { name, email } }, { status: 400 });
  }

  // Create new user
  const hashedPassword = await hashPassword(password);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      role: "user",
      updatedAt: new Date(),
    },
  });

  // Redirect to login page
  return redirect("/login");
}

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    } else if (actionData?.errors?.confirmPassword) {
      confirmPasswordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="新規登録" />

        <Box p={6} borderRadius="lg" boxShadow="md" bg="white">
          <VStack spacing={4} align="stretch">
            <Heading as="h2" size="lg" mb={4}>
              新規登録
            </Heading>

            <Form method="post">
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!actionData?.errors?.name}>
                  <FormLabel htmlFor="name">名前</FormLabel>
                  <Input
                    id="name"
                    ref={nameRef}
                    name="name"
                    defaultValue={actionData?.values?.name}
                    aria-invalid={actionData?.errors?.name ? true : undefined}
                    aria-describedby="name-error"
                  />
                  {actionData?.errors?.name && (
                    <FormErrorMessage id="name-error">{actionData.errors.name}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!actionData?.errors?.email}>
                  <FormLabel htmlFor="email">メールアドレス</FormLabel>
                  <Input
                    id="email"
                    ref={emailRef}
                    name="email"
                    type="email"
                    defaultValue={actionData?.values?.email}
                    autoComplete="email"
                    aria-invalid={actionData?.errors?.email ? true : undefined}
                    aria-describedby="email-error"
                  />
                  {actionData?.errors?.email && (
                    <FormErrorMessage id="email-error">{actionData.errors.email}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!actionData?.errors?.password}>
                  <FormLabel htmlFor="password">パスワード</FormLabel>
                  <Input
                    id="password"
                    ref={passwordRef}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={actionData?.errors?.password ? true : undefined}
                    aria-describedby="password-error"
                  />
                  {actionData?.errors?.password ? (
                    <FormErrorMessage id="password-error">{actionData.errors.password}</FormErrorMessage>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      パスワードは8文字以上で、大文字と記号を含める必要があります
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!actionData?.errors?.confirmPassword}>
                  <FormLabel htmlFor="confirmPassword">パスワード（確認）</FormLabel>
                  <Input
                    id="confirmPassword"
                    ref={confirmPasswordRef}
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={actionData?.errors?.confirmPassword ? true : undefined}
                    aria-describedby="confirm-password-error"
                  />
                  {actionData?.errors?.confirmPassword && (
                    <FormErrorMessage id="confirm-password-error">
                      {actionData.errors.confirmPassword}
                    </FormErrorMessage>
                  )}
                </FormControl>

                <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                  登録
                </Button>
              </VStack>
            </Form>

            <Box mt={4}>
              <Text>
                既にアカウントをお持ちの方は{" "}
                <Link to="/login" style={{ color: "blue", textDecoration: "underline" }}>
                  ログイン
                </Link>
                {" "}してください。
              </Text>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
