import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useSearchParams, useNavigation } from "@remix-run/react";
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
import { createUserSession, getUser, verifyLogin } from "~/utils/session.server";
import { Header, LoadingOverlay } from "~/components";

export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already logged in, redirect to the home page
  const user = await getUser(request);
  if (user) return redirect("/");
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") || "/";

  // Validate form data
  if (typeof email !== "string" || !email) {
    return json(
      { errors: { email: "メールアドレスを入力してください", password: null } },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || !password) {
    return json(
      { errors: { email: null, password: "パスワードを入力してください" } },
      { status: 400 }
    );
  }

  if (typeof redirectTo !== "string" || !redirectTo) {
    return json(
      { errors: { email: null, password: null, redirectTo: "リダイレクト先が無効です" } },
      { status: 400 }
    );
  }

  // Verify login
  const user = await verifyLogin(email, password);
  if (!user) {
    return json(
      { errors: { email: "メールアドレスまたはパスワードが正しくありません", password: null } },
      { status: 400 }
    );
  }

  // Create user session and redirect
  return createUserSession({
    userId: user.id,
    role: user.role,
    redirectTo,
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigation = useNavigation();
  const [customLoading, setCustomLoading] = useState(false);
  const isSubmitting = navigation.state === "submitting" || customLoading;

  // Set customLoading when form is submitted
  useEffect(() => {
    if (navigation.state === "submitting") {
      setCustomLoading(true);
    } else if (navigation.state === "idle" && customLoading) {
      // Clear customLoading after a delay to ensure UI has updated
      setTimeout(() => {
        setCustomLoading(false);
      }, 500);
    }
  }, [navigation.state, customLoading]);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Header title="ログイン" />

        <Box p={6} borderRadius="lg" boxShadow="md" bg="white">
          <VStack spacing={4} align="stretch">
            <Heading as="h2" size="lg" mb={4}>
              ログイン
            </Heading>

            <LoadingOverlay
              isLoading={isSubmitting}
              text="ログイン中..."
            >
              <Form method="post">
                <VStack spacing={4} align="stretch">
                  <input
                    type="hidden"
                    name="redirectTo"
                    value={redirectTo}
                  />

                  <FormControl isInvalid={!!actionData?.errors?.email}>
                    <FormLabel htmlFor="email">メールアドレス</FormLabel>
                    <Input
                      id="email"
                      ref={emailRef}
                      name="email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={actionData?.errors?.email ? true : undefined}
                      aria-describedby="email-error"
                      disabled={isSubmitting}
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
                      autoComplete="current-password"
                      aria-invalid={actionData?.errors?.password ? true : undefined}
                      aria-describedby="password-error"
                      disabled={isSubmitting}
                    />
                    {actionData?.errors?.password && (
                      <FormErrorMessage id="password-error">{actionData.errors.password}</FormErrorMessage>
                    )}
                  </FormControl>

                  <Button 
                    type="submit" 
                    colorScheme="blue" 
                    size="lg" 
                    mt={4}
                    isLoading={isSubmitting}
                    loadingText="ログイン中..."
                    disabled={isSubmitting}
                  >
                    ログイン
                  </Button>
                </VStack>
              </Form>
            </LoadingOverlay>

            <Box mt={4}>
              <Text>
                アカウントをお持ちでない方は{" "}
                <Link 
                  to={isSubmitting ? undefined : "/signup"} 
                  onClick={isSubmitting ? (e) => e.preventDefault() : undefined}
                  style={{ 
                    color: isSubmitting ? "gray.400" : "blue", 
                    textDecoration: "underline",
                    pointerEvents: isSubmitting ? "none" : "auto",
                    opacity: isSubmitting ? 0.4 : 1
                  }}
                >
                  新規登録
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
