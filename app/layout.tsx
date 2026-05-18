import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Maison Des Vapes — Admin",
  description: "Product catalogue management for the La Maison Des Vapes shop.",
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
