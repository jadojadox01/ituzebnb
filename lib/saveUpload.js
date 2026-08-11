import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const MAX_IMAGE_BYTES = 4.2 * 1024 * 1024;
const MAX_VIDEO_BYTES = 90 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const ALLOWED_FOLDERS = new Set(["rooms", "hero", "logo", "videos", "general"]);

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function uploadToCloudinary(file, folder, isVideo) {
  configureCloudinary();
  const bytes = Buffer.from(await file.arrayBuffer());
  const resourceType = isVideo ? "video" : "image";
  const publicIdBase = safeFilename(path.basename(file.name, path.extname(file.name))) || "upload";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ituzebnb/${folder}`,
        resource_type: resourceType,
        public_id: `${Date.now()}-${publicIdBase}`,
        overwrite: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(bytes);
  });
}

async function saveToLocalDisk(file, folder, isVideo) {
  const targetFolder = folder === "videos" || isVideo ? "videos" : folder;
  const uploadsDir = path.join(process.cwd(), "public", "uploads", targetFolder);
  await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || (isVideo ? ".mp4" : ".jpg");
  const filename = `${Date.now()}-${safeFilename(path.basename(file.name, ext))}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), bytes);

  return `/uploads/${targetFolder}/${filename}`;
}

export async function saveUploadedFile(file, folder = "general") {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No file provided");
  }

  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error("Invalid upload folder");
  }

  const isVideo = VIDEO_TYPES.has(file.type);
  const isImage = IMAGE_TYPES.has(file.type);

  if (!isImage && !isVideo) {
    throw new Error("Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, or WebM.");
  }

  const maxSize = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxSize) {
    throw new Error(isVideo ? "Video must be under 90MB" : "Image must be under 4MB for upload");
  }

  const targetFolder = folder === "videos" || isVideo ? "videos" : folder;

  if (cloudinaryConfigured()) {
    return uploadToCloudinary(file, targetFolder, isVideo);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Cloudinary is required in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return saveToLocalDisk(file, folder, isVideo);
}
