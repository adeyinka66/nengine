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
exports.removeDiscountFromCart = exports.applyDiscountToCart = exports.deleteDiscount = exports.updateDiscount = exports.getDiscountById = exports.getAllDiscounts = exports.createDiscount = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Discount_1 = __importDefault(require("../models/Discount"));
const Cart_1 = __importDefault(require("../models/Cart"));
// import Product from '../models/Product';
/**
 * Create a new discount code
 */
const createDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, type, value, minOrderValue, applicableProducts, applicableCategories, startDate, endDate, usageLimit, buyQuantity, getQuantity, getDiscountValue, } = req.body;
        // Validate the discount type and required fields
        if (!validateDiscountFields(req.body)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount configuration',
            });
        }
        // Check if discount code already exists
        const existingDiscount = yield Discount_1.default.findOne({ code: code.toUpperCase() });
        if (existingDiscount) {
            return res.status(400).json({
                success: false,
                message: 'Discount code already exists',
            });
        }
        const discount = new Discount_1.default({
            code: code.toUpperCase(),
            type,
            value,
            minOrderValue: minOrderValue || 0,
            applicableProducts: applicableProducts || [],
            applicableCategories: applicableCategories || [],
            startDate: startDate || new Date(),
            endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
            usageLimit: usageLimit || 0,
            usageCount: 0,
            isActive: true,
            buyQuantity,
            getQuantity,
            getDiscountValue,
        });
        yield discount.save();
        res.status(201).json({
            success: true,
            message: 'Discount code created successfully',
            data: discount,
        });
    }
    catch (error) {
        console.error('Error creating discount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create discount',
            error: error.message,
        });
    }
});
exports.createDiscount = createDiscount;
/**
 * Get all discount codes (with optional filters)
 */
const getAllDiscounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { active, type, code, page = 1, limit = 10 } = req.query;
        const query = {};
        // Apply filters if provided
        if (active !== undefined) {
            query.isActive = active === 'true';
        }
        if (type) {
            query.type = type;
        }
        if (code) {
            query.code = { $regex: code, $options: 'i' };
        }
        // Check for active discounts based on date
        if (active === 'true') {
            const now = new Date();
            query.startDate = { $lte: now };
            query.endDate = { $gte: now };
        }
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
        };
        const discounts = yield Discount_1.default.find(query)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit)
            .sort(options.sort);
        const total = yield Discount_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                discounts,
                total,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(total / options.limit),
            },
        });
    }
    catch (error) {
        console.error('Error fetching discounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch discounts',
            error: error.message,
        });
    }
});
exports.getAllDiscounts = getAllDiscounts;
/**
 * Get discount by ID
 */
const getDiscountById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount ID',
            });
        }
        const discount = yield Discount_1.default.findById(id);
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Discount not found',
            });
        }
        res.status(200).json({
            success: true,
            data: discount,
        });
    }
    catch (error) {
        console.error('Error fetching discount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch discount',
            error: error.message,
        });
    }
});
exports.getDiscountById = getDiscountById;
/**
 * Update discount
 */
const updateDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount ID',
            });
        }
        // Check if we're trying to update the code and it already exists
        if (updateData.code) {
            const existingDiscount = yield Discount_1.default.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id },
            });
            if (existingDiscount) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code already exists',
                });
            }
            // Convert code to uppercase
            updateData.code = updateData.code.toUpperCase();
        }
        // If updating discount type or value, validate fields
        if (updateData.type || updateData.value) {
            const discount = yield Discount_1.default.findById(id);
            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Discount not found',
                });
            }
            const validationData = Object.assign(Object.assign({}, discount.toObject()), updateData);
            if (!validateDiscountFields(validationData)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid discount configuration',
                });
            }
        }
        const updatedDiscount = yield Discount_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedDiscount) {
            return res.status(404).json({
                success: false,
                message: 'Discount not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Discount updated successfully',
            data: updatedDiscount,
        });
    }
    catch (error) {
        console.error('Error updating discount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update discount',
            error: error.message,
        });
    }
});
exports.updateDiscount = updateDiscount;
/**
 * Delete discount
 */
const deleteDiscount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid discount ID',
            });
        }
        const discount = yield Discount_1.default.findByIdAndDelete(id);
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Discount not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Discount deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting discount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete discount',
            error: error.message,
        });
    }
});
exports.deleteDiscount = deleteDiscount;
/**
 * Apply discount to cart
 */
const applyDiscountToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { code } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Discount code is required',
            });
        }
        // Find the discount
        const discount = yield Discount_1.default.findOne({
            code: code.toUpperCase(),
            isActive: true,
        });
        if (!discount) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or inactive discount code',
            });
        }
        // Check if discount is valid (dates, usage limit)
        const isValid = yield validateDiscountUsage(discount);
        if (!isValid.valid) {
            return res.status(400).json({
                success: false,
                message: isValid.message,
            });
        }
        // Get the user's cart
        const cart = yield Cart_1.default.findOne({ user: userId }).populate({
            path: 'items.product',
            select: 'price name category',
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Your cart is empty',
            });
        }
        // Check if minimum order value requirement is met
        if (discount.minOrderValue > 0 && cart.subtotal < discount.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value of $${discount.minOrderValue.toFixed(2)} required for this discount`,
            });
        }
        // Calculate discount amount based on type
        const discountAmount = yield calculateDiscountAmount(discount, cart);
        // Update the cart with the discount
        cart.discountCode = discount.code;
        cart.discountAmount = discountAmount;
        cart.total = cart.subtotal + cart.shipping - discountAmount;
        yield cart.save();
        // Increment usage count
        discount.usageCount += 1;
        yield discount.save();
        res.status(200).json({
            success: true,
            message: 'Discount applied successfully',
            data: {
                cart,
                discountAmount,
                total: cart.total,
            },
        });
    }
    catch (error) {
        console.error('Error applying discount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply discount',
            error: error.message,
        });
    }
});
exports.applyDiscountToCart = applyDiscountToCart;
/**
 * Remove discount from cart
 */
const removeDiscountFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Get the user's cart
        const cart = yield Cart_1.default.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }
        // Check if there's a discount applied
        if (!cart.discountCode) {
            return res.status(400).json({
                success: false,
                message: 'No discount applied to remove',
            });
        }
        // Remove the discount
        cart.discountCode = '';
        cart.discountAmount = 0;
        cart.total = cart.subtotal + cart.shipping;
        yield cart.save();
        res.status(200).json({
            success: true,
            message: 'Discount removed successfully',
            data: cart,
        });
    }
    catch (error) {
        console.error('Error removing discount:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove discount',
            error: error.message,
        });
    }
});
exports.removeDiscountFromCart = removeDiscountFromCart;
/**
 * Validate discount fields based on type
 */
const validateDiscountFields = (discount) => {
    // Common validations
    if (!discount.code || !discount.type || discount.value === undefined) {
        return false;
    }
    // Type-specific validations
    switch (discount.type) {
        case 'percentage':
            return discount.value > 0 && discount.value <= 100;
        case 'fixed':
            return discount.value > 0;
        case 'buyXgetY':
            return (discount.buyQuantity > 0 &&
                discount.getQuantity > 0 &&
                discount.getDiscountValue >= 0 &&
                discount.getDiscountValue <= 100);
        default:
            return false;
    }
};
/**
 * Validate if a discount can be used
 */
const validateDiscountUsage = (discount) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    // Check date range
    if (now < discount.startDate) {
        return {
            valid: false,
            message: `This discount code is not active yet. It will be active from ${discount.startDate.toLocaleDateString()}`,
        };
    }
    if (now > discount.endDate) {
        return {
            valid: false,
            message: 'This discount code has expired',
        };
    }
    // Check usage limit
    if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
        return {
            valid: false,
            message: 'This discount code has reached its usage limit',
        };
    }
    return { valid: true, message: 'Discount is valid' };
});
/**
 * Calculate discount amount based on type and cart content
 */
const calculateDiscountAmount = (discount, cart) => __awaiter(void 0, void 0, void 0, function* () {
    let applicableAmount = 0;
    // If discount has product or category restrictions, calculate applicable amount
    if (discount.applicableProducts.length > 0 ||
        discount.applicableCategories.length > 0) {
        // Filter products that qualify for the discount
        for (const item of cart.items) {
            const product = item.product;
            // Check if this product or its category is applicable
            const isProductApplicable = discount.applicableProducts.length === 0 ||
                discount.applicableProducts.some(id => id.toString() === product._id.toString());
            const isCategoryApplicable = discount.applicableCategories.length === 0 ||
                discount.applicableCategories.some(id => id.toString() === product.category.toString());
            if (isProductApplicable || isCategoryApplicable) {
                applicableAmount += item.quantity * item.price;
            }
        }
    }
    else {
        // If no restrictions, apply to entire cart
        applicableAmount = cart.subtotal;
    }
    // If no products qualify for the discount
    if (applicableAmount === 0) {
        return 0;
    }
    // Calculate based on discount type
    switch (discount.type) {
        case 'percentage':
            return (applicableAmount * discount.value) / 100;
        case 'fixed':
            return Math.min(discount.value, applicableAmount);
        case 'buyXgetY': {
            let discountAmount = 0;
            // Group items by product for buyXgetY calculation
            const productQuantities = {};
            for (const item of cart.items) {
                const productId = item.product._id.toString();
                const isApplicable = discount.applicableProducts.length === 0 ||
                    discount.applicableProducts.some(id => id.toString() === productId) ||
                    discount.applicableCategories.length === 0 ||
                    discount.applicableCategories.some(id => id.toString() === item.product.category.toString());
                if (isApplicable) {
                    if (!productQuantities[productId]) {
                        productQuantities[productId] = {
                            quantity: 0,
                            price: item.price,
                        };
                    }
                    productQuantities[productId].quantity += item.quantity;
                }
            }
            // Calculate discount for each product
            for (const productId in productQuantities) {
                const { quantity, price } = productQuantities[productId];
                const sets = Math.floor(quantity /
                    ((discount.buyQuantity || 0) + (discount.getQuantity || 0)));
                const discountedItems = Math.min(sets * (discount.getQuantity || 0), quantity);
                discountAmount +=
                    discountedItems * price * ((discount.getDiscountValue || 0) / 100);
            }
            return discountAmount;
        }
        default:
            return 0;
    }
});
exports.default = {
    createDiscount: exports.createDiscount,
    getAllDiscounts: exports.getAllDiscounts,
    getDiscountById: exports.getDiscountById,
    updateDiscount: exports.updateDiscount,
    deleteDiscount: exports.deleteDiscount,
    applyDiscountToCart: exports.applyDiscountToCart,
    removeDiscountFromCart: exports.removeDiscountFromCart,
};
