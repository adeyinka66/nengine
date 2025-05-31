"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const errorHandler = (err, req, res, next) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }
    // Handle custom error
    if (err instanceof errorHandler_1.default) {
        res.status(err.statusCode).json(err.toJSON());
        return;
    }
    // Handle mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: 'Validation Error',
            error: err.message,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            error: 'Resource not found',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: 'Authentication failed',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle JWT expiration
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            message: 'Token expired',
            error: 'Authentication failed',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Default error
    res.status(500).json(Object.assign({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Something went wrong', timestamp: new Date().toISOString() }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
