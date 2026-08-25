export declare const uploadPaymentProof: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadPresentation: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadProposal: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadDocument: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Build a storage key from the uploaded file path relative to uploads dir.
 * Used for database storage_key field.
 */
export declare function getStorageKey(filePath: string): string;
/**
 * Get the full file path from a storage key.
 */
export declare function getFilePath(storageKey: string): string;
//# sourceMappingURL=upload.middleware.d.ts.map