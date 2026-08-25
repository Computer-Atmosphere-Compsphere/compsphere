import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");

// Ensure upload directories exist
const dirs = ["payments", "proposals", "presentations", "documents"];
dirs.forEach((dir) => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

function createStorage(subDir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(uploadsDir, subDir));
    },
    filename: (_req, file, cb) => {
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueId}${ext}`);
    },
  });
}

function fileFilter(allowedMimes: string[]) {
  return (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(", ")}`
        )
      );
    }
  };
}

const MAX_PAYMENT_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_SLIDE_SIZE = 10 * 1024 * 1024;    // 10MB
const MAX_PROPOSAL_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;  // 5MB

export const uploadPaymentProof = multer({
  storage: createStorage("payments"),
  limits: { fileSize: MAX_PAYMENT_SIZE },
  fileFilter: fileFilter(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
}).single("proof");

export const uploadPresentation = multer({
  storage: createStorage("presentations"),
  limits: { fileSize: MAX_SLIDE_SIZE },
  fileFilter: fileFilter([
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ]),
}).single("slide");

export const uploadProposal = multer({
  storage: createStorage("proposals"),
  limits: { fileSize: MAX_PROPOSAL_SIZE },
  fileFilter: fileFilter(["application/pdf"]),
}).single("proposal");

export const uploadDocument = multer({
  storage: createStorage("documents"),
  limits: { fileSize: MAX_DOCUMENT_SIZE },
  fileFilter: fileFilter(["image/jpeg", "image/png", "application/pdf"]),
}).single("document");

/**
 * Build a storage key from the uploaded file path relative to uploads dir.
 * Used for database storage_key field.
 */
export function getStorageKey(filePath: string): string {
  return path.relative(uploadsDir, filePath);
}

/**
 * Get the full file path from a storage key.
 */
export function getFilePath(storageKey: string): string {
  return path.join(uploadsDir, storageKey);
}
