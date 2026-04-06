"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAuthSession } from "aws-amplify/auth";
import "@/lib/amplify";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        if (session.tokens) {
          router.replace("/notes");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}