"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, confirmEmail } from "@/lib/auth";
import "@/lib/amplify";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep]         = useState<"signup" | "verify">("signup");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSignup() {
    setLoading(true);
    setError("");
    try {
      await register(email, password);
      setStep("verify");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      await confirmEmail(email, code);
      router.push("/login");
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
          {step === "signup" ? "Create Account" : "Verify Email"}
        </h1>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        {step === "signup" ? (
          <>
            <input
              className="w-full border rounded-lg p-3 mb-3 placeholder:text-gray-400 focus:outline-none focus:ring-2 text-black focus:ring-blue-500"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full border rounded-lg p-3 placeholder:text-gray-400 mb-4 focus:outline-none text-black focus:ring-2 focus:ring-blue-500"
              placeholder="Password (min 8 chars, 1 uppercase, 1 number)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
            <p className="text-center text-sm mt-4 text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Login
              </a>
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-4 text-center">
              We sent a verification code to <strong>{email}</strong>
            </p>
            <input
              className="w-full border rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}