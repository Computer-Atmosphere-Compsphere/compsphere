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

const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, "../../../uploads");

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
      throw new Error(`Temp file not found at ${localTempPath}`);
    }

    const fileBuffer = fs.readFileSync(localTempPath);
    
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`[Supabase Storage Error] Failed to upload ${fileName} to bucket ${bucketName}:`, error);
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
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
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
