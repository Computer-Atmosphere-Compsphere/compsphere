import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export const isSupabase = process.env.STORAGE_PROVIDER === "supabase";

function getJwtRole(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], "base64").toString("utf-8");
      const claims = JSON.parse(payload);
      return claims.role || "unknown";
    }
  } catch (e) {
    return "error";
  }
  return "invalid";
}

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
if (isSupabase && supabaseKey) {
  console.log(`[Storage Init] Supabase URL: ${process.env.SUPABASE_URL}, Role of key: ${getJwtRole(supabaseKey)}`);
}

// We initialize the supabase client conditionally to prevent errors if variables are not provided in local dev
export const supabase = isSupabase
  ? createClient(
      process.env.SUPABASE_URL || "",
      supabaseKey
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
    const keyRole = getJwtRole(supabaseKey);
    console.log(`[Storage] Uploading ${fileName} (${fileBuffer.byteLength}B) to bucket "${bucketName}" using role="${keyRole}"...`);

    // Auto-create bucket if it doesn't exist yet
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    console.log(`[Storage] listBuckets result: ${listError ? `error=${JSON.stringify(listError)}` : `found ${buckets?.length ?? 0} buckets`}`);
    if (!listError && buckets && !buckets.some((b) => b.name === bucketName)) {
      console.log(`[Storage] Bucket "${bucketName}" missing — creating...`);
      const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: true });
      if (createErr) {
        console.error(`[Storage] Failed to create bucket "${bucketName}":`, JSON.stringify(createErr));
        // Don't throw — try upload anyway, bucket may exist with different config
      }
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, { contentType: mimeType, upsert: true });

    if (error) {
      console.error(`[Storage] Upload failed (role="${keyRole}"): ${JSON.stringify(error)}`);
      throw new Error(`Supabase Storage upload failed (role=${keyRole}): ${error.message}`);
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
