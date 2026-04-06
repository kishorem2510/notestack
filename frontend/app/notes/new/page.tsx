"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/lib/api";
import "@/lib/amplify";

export default function NewNotePage() {
  const router                = useRouter();
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [file, setFile]       = useState<File | null>(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createNote(title, content, file || undefined);
      router.push("/notes");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">📝 NoteStack</h1>
        <button
          onClick={() => router.push("/notes")}
          className="text-gray-500 text-sm hover:underline"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">New Note</h2>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        <input
          className="w-full border rounded-lg p-3 mb-3 placeholder:text-gray-400 text-black text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded-lg p-3 mb-4 placeholder:text-gray-400 text-black h-48 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write your note here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center">
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer text-blue-600 hover:underline text-sm"
          >
            📎 {file ? file.name : "Attach a file (optional)"}
          </label>
          {file && (
            <button
              onClick={() => setFile(null)}
              className="ml-3 text-red-400 text-xs hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  );
}