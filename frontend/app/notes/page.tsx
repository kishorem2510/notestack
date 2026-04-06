"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNotes, deleteNote } from "@/lib/api";
import { logout } from "@/lib/auth";
import "@/lib/amplify";

interface Note {
  noteId: string;
  title: string;
  content: string;
  createdAt: string;
  fileKey?: string;
  fileName?: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try {
      const data = await getNotes();
      setNotes(data.notes || []);
    } catch (e: any) {
      if (
        e.message.includes("401") ||
        e.message.includes("Unauthorized")
      ) {
        router.push("/login");
      } else {
        setError("Failed to load notes");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
    } catch {
      alert("Failed to delete note");
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">NoteStack</h1>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/notes/new")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            + New Note
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {loading && (
          <p className="text-center text-gray-400 mt-20">
            Loading notes...
          </p>
        )}

        {error && (
          <p className="text-center text-red-500 mt-20">{error}</p>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center mt-20">
            <p className="text-gray-400 text-lg">No notes yet!</p>
            <button
              onClick={() => router.push("/notes/new")}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create your first note
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.noteId}
              className="bg-white rounded-2xl shadow p-5 hover:shadow-md transition"
            >
              {/* Title Row */}
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-semibold text-gray-800">
                  {note.title}
                </h2>
                {/* File badge */}
                {note.fileKey && (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                    Attachment
                  </span>
                )}
              </div>

              {/* Content preview */}
              <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                {note.content}
              </p>

              {/* File name if exists */}
              {note.fileName && (
                <p className="text-xs text-blue-500 mb-3">
                  {note.fileName}
                </p>
              )}

              {/* Date */}
              <p className="text-xs text-gray-300 mb-4">
                {new Date(note.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/notes/${note.noteId}`)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(note.noteId)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}