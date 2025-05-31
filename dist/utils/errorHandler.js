"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = void 0;
class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.error = message;
        this.timestamp = new Date().toISOString();
        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
    // Helper method to create a standardized error response
    toJSON() {
        return Object.assign({ success: this.success, message: this.message, 
            // error: this.error,
            statusCode: this.statusCode, timestamp: this.timestamp }, (process.env.NODE_ENV === 'development' && { stack: this.stack }));
    }
}
// Helper function to create common error types
exports.createError = {
    badRequest: (message) => new ErrorHandler(message, 400),
    unauthorized: (message) => new ErrorHandler(message, 401),
    forbidden: (message) => new ErrorHandler(message, 403),
    notFound: (message) => new ErrorHandler(message, 404),
    internal: (message) => new ErrorHandler(message, 500),
};
exports.default = ErrorHandler;
