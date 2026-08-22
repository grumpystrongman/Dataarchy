import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dataarchy — Analytics OS",
  description: "An opinionated AI-native operating environment for Databricks analytics.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
