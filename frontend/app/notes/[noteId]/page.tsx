"use client";
import "@/lib/amplify";
import { deleteNote, getNote, updateNote } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ExistingFile {
  name: string;
  url: string;
}

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<ExistingFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNote() {
      try {
        const data = await getNote(noteId);
        setTitle(data.note.title);
        setContent(data.note.content);
        if (data.note.fileKey) {
          setExistingFile({
            name: data.note.fileName,
            url: data.note.fileUrl,
          });
        }
      } catch {
        setError("Note not found");
      } finally {
        setLoading(false);
      }
    }
    fetchNote();
  }, [noteId]);

  async function handleUpdate() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateNote(noteId, title, content, file || undefined);
      router.push("/notes");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(noteId);
      router.push("/notes");
    } catch {
      alert("Failed to delete");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (selected && selected.length > 0) {
      setFile(selected[0]);
    } else {
      setFile(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">NoteStack</h1>
        <button
          onClick={() => router.push("/notes")}
          className="text-gray-500 text-sm hover:underline"
        >
          Back
        </button>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-blue-500 mb-6">Edit Note</h2>

        {error && (
          <p className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </p>
        )}

        <input
          className="w-full border rounded-lg p-3 mb-3 text-lg placeholder:text-gray-400 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          placeholder="Note title"
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded-lg p-3 mb-4 h-48 placeholder:text-gray-400 text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={content}
          placeholder="Write your note here..."
          onChange={(e) => setContent(e.target.value)}
        />

        {existingFile && !file && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {existingFile.name}
            </span>
            <a
              href={existingFile.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 text-sm hover:underline"
            >
              Download
            </a>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 text-center">
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer text-blue-600 hover:underline text-sm"
          >
            {file ? file.name : "Replace or attach a file (optional)"}
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

        <div className="flex gap-3">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-50 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-100"
          >
            Delete Note
          </button>
        </div>
      </div>
    </div>
  );
}