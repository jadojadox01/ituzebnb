import "./globals.css";

export const metadata = {
  title: "ITUZE BNB | House Rentals and Booking",
  description: "Browse, compare, and book secure house rentals with a smooth modern experience.",
  openGraph: {
    title: "ITUZE BNB | House Rentals and Booking",
    description: "Modern house rental listings with responsive search, booking, and owner contact flows.",
    type: "website"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
