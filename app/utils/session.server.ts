import { createCookieSessionStorage, redirect } from "@remix-run/node";
import bcrypt from "bcryptjs";

import prisma from "~/.server/db/client";

// Define the session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: ["s3cr3t"], // Replace with a real secret from environment variable
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
});

// Get the session from the request
export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

// Create a new user session
export async function createUserSession({
  userId,
  role,
  redirectTo,
}: {
  userId: number;
  role: string;
  redirectTo: string;
}) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
  session.set("role", role);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// Get the user ID from the session
export async function getUserId(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "number") return null;
  return userId;
}

// Get the user role from the session
export async function getUserRole(request: Request) {
  const session = await getSession(request);
  const role = session.get("role");
  if (!role || typeof role !== "string") return null;
  return role;
}

// Get the user from the session
export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === null) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return null;

  return user;
}

// Require a user to be logged in
export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

// Require a user to have a specific role
export async function requireUserRole(
  request: Request,
  role: string,
  redirectTo: string = "/"
) {
  const userRole = await getUserRole(request);
  if (userRole !== role) {
    throw redirect(redirectTo);
  }
  return userRole;
}

// Log out the user
export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

// Verify a user's login
export async function verifyLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) return null;

  const { compare } = bcrypt;
  const isValid = await compare(password, user.passwordHash);
  if (!isValid) return null;

  return user;
}

// Hash a password
export async function hashPassword(password: string) {
  const { hash } = bcrypt;
  return hash(password, 10);
}