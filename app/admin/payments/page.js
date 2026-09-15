import { redirect } from "next/navigation";

/** Payments admin UI is hidden — keep IntouchPay server APIs only. */
export default function AdminPaymentsPage() {
  redirect("/admin/dashboard");
}
