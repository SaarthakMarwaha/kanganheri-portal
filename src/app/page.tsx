import { redirect } from "next/navigation";

/**
 * Root redirect from `/` to `/hi` (default locale).
 * next-intl middleware handles locale detection, but this catches
 * any requests that bypass middleware (e.g., direct access to /).
 */
export default function RootPage() {
  redirect("/hi");
}
