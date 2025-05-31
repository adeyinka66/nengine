"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticatedUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../utils/errorHandler");
const catchAsyncErrors_1 = require("./catchAsyncErrors");
// Check if user is authenticated
exports.isAuthenticatedUser = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const bearerToken = req.headers.authorization;
    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
        return next(errorHandler_1.createError.unauthorized('Please provide a valid bearer token'));
    }
    const token = bearerToken.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = yield User_1.default.findById(decoded.id).select('_id role');
        if (!user) {
            return next(errorHandler_1.createError.unauthorized('User not found'));
        }
        req.user = {
            _id: user._id,
            role: user.role,
        };
        next();
    }
    catch (error) {
        return next(errorHandler_1.createError.unauthorized('Invalid or expired token'));
    }
}));
// Handling users roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        var _a;
        console.log(req.user);
        if (!req.user || !roles.includes(req.user.role)) {
            return next(errorHandler_1.createError.forbidden(`Access denied. ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) || 'User'} is not authorized to access this resource`));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
