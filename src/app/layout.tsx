import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pie Pathways — concept prototype",
  description:
    "A concept routing prototype: it points visitors to the right page, form or team without giving personal financial advice.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NZ">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
