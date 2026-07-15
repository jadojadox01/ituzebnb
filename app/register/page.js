import Link from "next/link";
import { Home, UserPlus } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const roles = [
  { value: "tenant", label: "Tenant", description: "Book houses and manage favorites." },
  { value: "landlord", label: "Landlord", description: "List houses and receive booking requests." }
];

export const metadata = {
  title: "Create Account | ITUZE BNB",
  description: "Create an ITUZE BNB tenant or landlord account."
};

export default function RegisterPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-lg bg-primary p-6 text-primary-foreground shadow-smooth">
          <Home size={34} aria-hidden="true" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-normal">Create your account.</h1>
          <p className="mt-4 leading-7 text-white/80">Choose whether you are looking for a home or listing one, then continue with a clean account setup.</p>
        </div>

        <form className="rounded-lg border border-border bg-card p-6 shadow-smooth" aria-label="Create account form">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Full name
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="Your full name" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Phone
              <input className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="+250..." />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Email
            <input type="email" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="you@example.com" />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Password
            <input type="password" className="min-h-12 rounded-md border border-input bg-background px-3 font-normal outline-none focus:border-primary" placeholder="Create a strong password" />
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold">Account type</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {roles.map((role) => (
                <label key={role.value} className="cursor-pointer rounded-lg border border-border bg-background p-4 transition has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input type="radio" name="role" value={role.value} defaultChecked={role.value === "tenant"} className="accent-primary" />
                  <span className="mt-3 block font-extrabold">{role.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{role.description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-extrabold text-secondary-foreground">
            <UserPlus size={16} aria-hidden="true" />
            Create Account
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already registered? <Link href="/login" className="font-bold text-primary">Sign In</Link>
          </p>
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
