/** Compress an image File in the browser before upload (helps Vercel 4.5MB limit). */
export async function compressImageFile(file, { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = {}) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    return file;
  }

  // Skip tiny files
  if (file.size < 900 * 1024) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const base = String(file.name || "image").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    const trimmed = text.trim();
    if (/request entity too large/i.test(trimmed) || res.status === 413) {
      throw new Error("Image is too large for upload. Try a smaller photo (under 4MB).");
    }
    throw new Error(trimmed.slice(0, 180) || `Upload failed (${res.status})`);
  }
}
