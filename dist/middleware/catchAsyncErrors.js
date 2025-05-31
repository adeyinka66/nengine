"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsyncErrors = void 0;
const catchAsyncErrors = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
        // Don't return anything from this function
    };
};
exports.catchAsyncErrors = catchAsyncErrors;
