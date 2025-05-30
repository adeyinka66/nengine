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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CartSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true }, // Price of each item
        },
    ],
    subtotal: { type: Number, required: true, default: 0 }, // Calculated field
    shipping: { type: Number, required: true, default: 0 }, // Free shipping for now
    discountCode: { type: String, default: null }, // Applied discount code
    discountAmount: { type: Number, default: 0 }, // Calculated discount amount
    total: { type: Number, required: true, default: 0 }, // Calculated total (subtotal + shipping - discount)
});
// Middleware to calculate subtotal and total price before saving the cart
CartSchema.pre('save', function (next) {
    const cart = this; // Use 'unknown' first to avoid type error
    cart.subtotal = cart.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    // Total = Subtotal + Shipping - Discount
    cart.total = cart.subtotal + cart.shipping - cart.discountAmount;
    next();
});
exports.default = mongoose_1.default.model('Cart', CartSchema);
