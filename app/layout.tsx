import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Chord Chart Maker",
  description: "Create printable chord charts with precise chord placement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans bg-neutral-50 text-neutral-900 min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
