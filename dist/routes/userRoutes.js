"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController = __importStar(require("../controllers/userController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post('/register', userController.register);
router.post('/login', userController.loginLimiter, userController.login);
router.post('/forgot-password', userController.forgotPassword);
// Authenticated user routes
router.get('/profile', authMiddleware_1.authenticate, (req, res, next) => {
    const authenticatedReq = req;
    userController.getProfile(authenticatedReq, res, next);
});
router.put('/profile', authMiddleware_1.authenticate, (req, res, next) => {
    const authenticatedReq = req;
    userController.updateProfile(authenticatedReq, res, next);
});
// Admin routes
router.get('/admin/list', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.getAllUsers);
router.get('/admin/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.getUserById);
router.put('/admin/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.updateUser);
router.delete('/admin/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.deleteUser);
router.patch('/admin/:id/role', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, userController.updateUserRole);
router.get('/generate-admin-token', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, (req, res, next) => {
    const authenticatedReq = req;
    userController.generateAdminCreationToken(authenticatedReq, res, next);
});
// Update reset password route to not require token
router.post('/reset-password', userController.resetPassword);
router.post('/password/forgot', userController.forgotPassword);
router.put('/password/reset/:token', userController.resetPassword);
// Admin creation route
router.post('/admin/register', userController.createAdmin);
exports.default = router;
