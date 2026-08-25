import { ZodError } from "zod";
export class AppError extends Error {
    statusCode;
    message;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.name = "AppError";
    }
}
export function errorHandler(err, req, res, _next) {
    // Ensure CORS headers are always present, even on errors
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: "Validation failed",
            details: err.errors,
        });
        return;
    }
    // Multer file errors
    if (err.message?.includes("Invalid file type") || err.message?.includes("File too large")) {
        res.status(400).json({
            success: false,
            error: err.message,
        });
        return;
    }
    // Custom application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code,
        });
        return;
    }
    // Unexpected errors
    console.error("[ERROR]", err);
    res.status(500).json({
        success: false,
        error: "Internal server error",
    });
}
//# sourceMappingURL=error.middleware.js.map