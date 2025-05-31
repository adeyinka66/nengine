"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favoriteController_1 = require("../controllers/favoriteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// All routes require authentication
// router.use(authenticate);
// Get user's favorites
router.get('/', authMiddleware_1.authenticate, favoriteController_1.getFavorites);
// Add to favorites
router.post('/add', authMiddleware_1.authenticate, favoriteController_1.addToFavorites);
// Remove from favorites
router.delete('/remove/:productId', authMiddleware_1.authenticate, favoriteController_1.removeFromFavorites);
// Clear all favorites
router.delete('/clear', authMiddleware_1.authenticate, favoriteController_1.clearFavorites);
exports.default = router;
