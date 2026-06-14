import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Spreetail Shared Expenses Dashboard",
  description: "An intelligent, audit-friendly shared expense manager with anomaly detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
