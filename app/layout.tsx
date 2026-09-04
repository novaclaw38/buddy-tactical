import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buddy — Tactical Academy",
  description: "An AI-powered tactical mission academy for kids.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
