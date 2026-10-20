import { randomBytes } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");
const useCloudinary = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (EXT[file.mimetype]) cb(null, true);
    else cb(new AppError(400, "Only JPG, PNG or WEBP images are allowed"));
  },
});

async function saveOne(file: Express.Multer.File, folder: string): Promise<string> {
  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `pawrescue/${folder}`, resource_type: "image", transformation: [{ width: 1600, crop: "limit" }, { quality: "auto", fetch_format: "auto" }] },
          (err, result) => (err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result.secure_url)),
        )
        .end(file.buffer);
    });
  }
  const dir = path.join(UPLOAD_DIR, folder);
  mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${EXT[file.mimetype]}`;
  writeFileSync(path.join(dir, name), file.buffer);
  return `/api/uploads/${folder}/${name}`;
}

export function saveImages(files: Express.Multer.File[] | undefined, folder: "requests" | "updates") {
  return Promise.all((files ?? []).map((f) => saveOne(f, folder)));
}
