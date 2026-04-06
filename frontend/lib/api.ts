import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Get all notes
export async function getNotes() {
  return await authFetch("/notes");
}

// Get one note
export async function getNote(noteId: string) {
  return await authFetch(`/notes/${noteId}`);
}

// Create note with optional file
export async function createNote(
  title: string,
  content: string,
  file?: File
) {
  let fileData: string | undefined;
  let fileName: string | undefined;

  if (file) {
    fileData = await fileToBase64(file);
    fileName = file.name;
  }

  return await authFetch("/notes", {
    method: "POST",
    body: JSON.stringify({ title, content, file: fileData, fileName }),
  });
}

// Update note with optional new file
export async function updateNote(
  noteId: string,
  title: string,
  content: string,
  file?: File
) {
  let fileData: string | undefined;
  let fileName: string | undefined;

  if (file) {
    fileData = await fileToBase64(file);
    fileName = file.name;
  }

  return await authFetch(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify({ title, content, file: fileData, fileName }),
  });
}

// Helper — convert File to base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => {
      // Remove "data:...;base64," prefix — send only raw base64
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Delete note
export async function deleteNote(noteId: string) {
  return await authFetch(`/notes/${noteId}`, { method: "DELETE" });
}