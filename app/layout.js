import "./globals.css";
import { TranslationProvider } from "@/lib/TranslationContext";
import { DynamicSiteTitle } from "@/components/DynamicSiteTitle";
import { Playfair_Display, DM_Sans } from "next/font/google";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "ITUZE B&B | Bed & Breakfast in Kigali",
  description: "Book authentic rooms at ITUZE B&B — real availability, transparent pricing, and Mobile Money payments.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1f4d3f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <TranslationProvider>
          <DynamicSiteTitle />
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
