import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { logout } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Redirect to home page if someone tries to access this route directly
  return redirect("/");
}

export async function action({ request }: ActionFunctionArgs) {
  return logout(request);
}