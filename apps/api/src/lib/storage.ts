import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const isSupabase = process.env.STORAGE_PROVIDER === "supabase";

// We initialize the supabase client conditionally to prevent errors if variables are not provided in local dev
export const supabase = isSupabase
  ? createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""
    )
  : null;

const uploadsDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? "/tmp/uploads" : path.join(__dirname, "../../../uploads"));

/**
 * Dynamically upload a local temporary file to either local disk or Supabase Storage.
 * After successful upload to Supabase, the local temporary file is cleaned up.
 * 
 * @param bucketName The folder name locally / Bucket name in Supabase (e.g. "proposals", "payments")
 * @param localTempPath The temporary path of the uploaded file on disk (from multer)
 * @param fileName The desired final filename (e.g. "unique-id.pdf")
 * @param mimeType The file's MIME type
 * @returns The storage key relative path (e.g. "proposals/unique-id.pdf")
 */
export async function uploadFileToStorage(
  bucketName: string,
  localTempPath: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const relativeKey = `${bucketName}/${fileName}`;

  if (isSupabase && supabase) {
    if (!fs.existsSync(localTempPath)) {
      throw new Error(`[Storage] Temp file not found at ${localTempPath}`);
    }

    const fileBuffer = fs.readFileSync(localTempPath);
    console.log(`[Storage] Uploading ${fileName} (${fileBuffer.byteLength}B) to Supabase bucket "${bucketName}"...`);

    // Auto-create bucket if it doesn't exist yet
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (!listError && buckets && !buckets.some((b) => b.name === bucketName)) {
      console.log(`[Storage] Bucket "${bucketName}" missing — creating...`);
      const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: false });
      if (createErr) {
        console.error(`[Storage] Failed to create bucket "${bucketName}":`, JSON.stringify(createErr));
        throw createErr;
      }
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.error(`[Storage] Supabase upload failed for "${fileName}" in bucket "${bucketName}":`, JSON.stringify(error));
      throw error;
    }

    // Clean up temporary local file after successful upload to Supabase
    try {
      fs.unlinkSync(localTempPath);
    } catch (e) {
      console.warn(`[Storage Warning] Failed to delete temporary local file at ${localTempPath}:`, e);
    }

    return relativeKey;
  } else {
    // Local storage fallback
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
      fs.renameSync(localTempPath, targetPath);
    } else {
      throw new Error(`Temp file not found at ${localTempPath} for local storage fallback`);
    }

    return relativeKey;
  }
}
