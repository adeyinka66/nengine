"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.get('/', categoryController_1.getAllCategories);
router.get('/:id', categoryController_1.getCategory);
// Protected routes (admin only)
router.post('/', (req, res, next) => {
    console.log('Auth Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    next();
}, auth_1.isAuthenticatedUser, (0, auth_1.authorizeRoles)('admin'), categoryController_1.createCategory);
router.put('/:id', (req, res, next) => {
    console.log('Auth Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    next();
}, auth_1.isAuthenticatedUser, (0, auth_1.authorizeRoles)('admin'), categoryController_1.updateCategory);
router.delete('/:id', (req, res, next) => {
    console.log('Auth Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    next();
}, auth_1.isAuthenticatedUser, (0, auth_1.authorizeRoles)('admin'), categoryController_1.deleteCategory);
exports.default = router;
