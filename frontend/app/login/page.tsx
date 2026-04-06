"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import "@/lib/amplify";

export default function LoginPage() {
  const router                  = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/notes");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
        <h1 className="text-2xl text-blue-500 font-bold mb-6 text-center">
          Welcome to NoteStack
        </h1>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        <input
          className="w-full border rounded-lg p-3 mb-3 placeholder:text-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-3 mb-4 placeholder:text-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm mt-4 text-gray-600">
          No account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}