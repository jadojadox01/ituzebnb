import Link from "next/link";
import { LogIn } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Sign In | ITUZE BNB",
  description: "Sign in to your ITUZE BNB account."
};

export default function LoginPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-17rem)] max-w-md place-items-center px-4 py-12">
        <form className="w-full rounded-lg border border-border bg-card p-6 shadow-smooth" aria-label="Sign in form">
          <h1 className="text-3xl font-extrabold">Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">Access bookings, saved homes, and dashboard tools.</p>
          <label className="mt-6 grid gap-2 text-sm font-bold">
            Email
            <input type="email" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="you@example.com" />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Password
            <input type="password" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="Your password" />
          </label>
          <button className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground">
            <LogIn size={16} aria-hidden="true" />
            Sign In
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here? <Link href="/register" className="font-bold text-primary">Create account</Link>
          </p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
