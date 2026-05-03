import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEGEND VAPE STORE — Admin",
  description: "Product catalogue management for the LEGEND VAPE STORE shop.",
  icons: {
    icon: "/Logo (2).png",
    apple: "/Logo (2).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-light text-bg-dark">{children}</body>
    </html>
  );
}
