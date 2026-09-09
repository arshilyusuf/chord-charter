import "./globals.css";
import type { Metadata } from "next";

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
      <body className="font-sans bg-neutral-50 text-neutral-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
