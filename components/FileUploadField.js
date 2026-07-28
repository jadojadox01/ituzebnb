"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

export function FileUploadField({
  label,
  folder = "general",
  accept = "image/*",
  multiple = false,
  value,
  onChange,
  hint,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const values = multiple
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : value
      ? [value]
      : [];

  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setError("");
    const uploaded = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        uploaded.push(data.url);
      }

      if (multiple) {
        onChange([...values, ...uploaded]);
      } else {
        onChange(uploaded[0] || "");
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index) => {
    if (!multiple) {
      onChange("");
      return;
    }
    onChange(values.filter((_, i) => i !== index));
  };

  const isImage = accept.includes("image");
  const isVideo = accept.includes("video");

  return (
    <div>
      {label ? <p className="mb-2 text-sm font-semibold">{label}</p> : null}
      {hint ? <p className="mb-2 text-xs text-muted-foreground">{hint}</p> : null}

      <div className="flex flex-wrap gap-3">
        {values.map((src, index) => (
          <div key={`${src}-${index}`} className="relative overflow-hidden rounded-md border border-border">
            {isVideo && src ? (
              <video src={src} className="h-24 w-40 object-cover" controls />
            ) : src ? (
              <img src={src} alt="" className="h-24 w-24 object-cover" />
            ) : null}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-xs text-white"
              aria-label="Remove file"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {(multiple || values.length === 0) && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-background text-xs text-muted-foreground hover:border-primary/50 disabled:opacity-60"
          >
            <Upload size={18} />
            {uploading ? "Uploading..." : isImage ? "Upload image" : "Upload file"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
      />

      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
