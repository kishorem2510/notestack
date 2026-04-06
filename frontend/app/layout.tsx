"use client";
import "./globals.css";
import { useEffect } from "react";
import "@/lib/amplify";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    import("@/lib/amplify");
  }, []);

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
} 