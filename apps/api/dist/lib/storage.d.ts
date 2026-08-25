export declare const isSupabase: boolean;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any> | null;
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
export declare function uploadFileToStorage(bucketName: string, localTempPath: string, fileName: string, mimeType: string): Promise<string>;
//# sourceMappingURL=storage.d.ts.map