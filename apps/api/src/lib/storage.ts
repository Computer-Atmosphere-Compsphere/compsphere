import fs from "fs";
import path from "path";
import crypto from "crypto";

export const isHostinger =
  process.env.STORAGE_PROVIDER?.trim().toLowerCase() === "hostinger";

const uploadsDir =
  process.env.UPLOAD_DIR ||
  (process.env.VERCEL
    ? "/tmp/uploads"
    : path.join(__dirname, "../../../uploads"));

/**
 * Upload a file to the Hostinger PHP storage bridge (production)
 * or move it to local disk (development).
 *
 * @param bucketName  Folder name on storage (e.g. "payments", "proposals")
 * @param localTempPath  Temp file path written by multer
 * @param fileName  Final filename (UUID-based, from upload middleware)
 * @param mimeType  File MIME type
 * @returns  The storage key (e.g. "payments/abc123.pdf") stored in DB
 */
export async function uploadFileToStorage(
  bucketName: string,
  localTempPath: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const checkHostinger =
    process.env.STORAGE_PROVIDER?.trim().toLowerCase() === "hostinger";

  if (checkHostinger) {
    if (!fs.existsSync(localTempPath)) {
      throw new Error(`[Storage] Temp file not found at: ${localTempPath}`);
    }

    const storageUrl = process.env.HOSTINGER_STORAGE_URL;
    const uploadToken = process.env.HOSTINGER_UPLOAD_TOKEN;

    if (!storageUrl || !uploadToken) {
      throw new Error(
        "[Storage] HOSTINGER_STORAGE_URL or HOSTINGER_UPLOAD_TOKEN is not set in environment variables."
      );
    }

    const fileBuffer = fs.readFileSync(localTempPath);
    const fileObj =
      typeof File !== "undefined"
        ? new File([fileBuffer], fileName, { type: mimeType })
        : new Blob([fileBuffer], { type: mimeType });

    const form = new FormData();
    form.append("file", fileObj, fileName);
    form.append("filename", fileName);
    form.append("folder", bucketName);

    console.log(
      `[Storage] Uploading ${fileName} (${fileBuffer.byteLength}B) to Hostinger folder="${bucketName}"...`
    );

    let response: Response;
    try {
      response = await fetch(`${storageUrl}?action=upload`, {
        method: "POST",
        headers: { "X-Storage-Token": uploadToken },
        body: form,
      });
    } catch (fetchErr: any) {
      throw new Error(
        `[Storage] Could not reach Hostinger storage at ${storageUrl}: ${fetchErr?.message || fetchErr}`
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `[Storage] Hostinger upload failed (HTTP ${response.status}): ${errText}`
      );
    }

    const result = (await response.json()) as { success: boolean; key: string };

    // Clean up temp file after successful remote upload
    try {
      fs.unlinkSync(localTempPath);
    } catch (e) {
      console.warn(`[Storage] Warning: could not delete temp file ${localTempPath}`, e);
    }

    console.log(`[Storage] Stored at key: ${result.key}`);
    return result.key;
  }

  // ── Local disk fallback (development) ────────────────────────────
  const relativeKey = `${bucketName}/${fileName}`;
  const targetDir = path.join(uploadsDir, bucketName);

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  } catch (e) {
    console.warn(`[Storage] Could not create directory ${targetDir}:`, e);
  }

  const targetPath = path.join(targetDir, fileName);
  if (fs.existsSync(localTempPath)) {
    try {
      fs.copyFileSync(localTempPath, targetPath);
      fs.unlinkSync(localTempPath);
    } catch (copyErr) {
      fs.renameSync(localTempPath, targetPath);
    }
  } else {
    throw new Error(
      `[Storage] Temp file not found at ${localTempPath} for local storage fallback`
    );
  }

  return relativeKey;
}

/**
 * Generate a time-limited HMAC-SHA256 presigned URL for private file access.
 * The Hostinger PHP bridge verifies the signature + expiry before streaming the file.
 *
 * @param storageKey  The key returned by uploadFileToStorage (e.g. "payments/abc.pdf")
 * @param ttlSeconds  How long the URL is valid — default 1 hour
 */
export function generatePresignedUrl(
  storageKey: string,
  ttlSeconds = 3600
): string {
  const signingKey = process.env.HOSTINGER_SIGNING_KEY;
  const storageUrl = process.env.HOSTINGER_STORAGE_URL;

  if (!signingKey || !storageUrl) {
    throw new Error(
      "[Storage] HOSTINGER_SIGNING_KEY or HOSTINGER_STORAGE_URL is not set"
    );
  }

  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${storageKey}:${expires}`;
  const sig = crypto
    .createHmac("sha256", signingKey)
    .update(payload)
    .digest("hex");

  return `${storageUrl}?key=${encodeURIComponent(storageKey)}&expires=${expires}&sig=${sig}`;
}
