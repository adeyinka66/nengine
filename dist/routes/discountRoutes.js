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
const discountController = __importStar(require("../controllers/discountController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Admin routes (Create, Read, Update, Delete)
router.post('/', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, discountController.createDiscount);
router.get('/', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, discountController.getAllDiscounts);
router.get('/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, discountController.getDiscountById);
router.put('/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, discountController.updateDiscount);
router.delete('/:id', authMiddleware_1.authenticate, authMiddleware_1.authorizeAdmin, discountController.deleteDiscount);
// Customer routes (apply/remove discount)
router.post('/apply', authMiddleware_1.authenticate, discountController.applyDiscountToCart);
router.delete('/remove', authMiddleware_1.authenticate, discountController.removeDiscountFromCart);
exports.default = router;
