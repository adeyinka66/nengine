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
exports.deleteCategory = exports.updateCategory = exports.getCategory = exports.getAllCategories = exports.createCategory = void 0;
const Category_1 = require("../models/Category");
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const Product_1 = require("../models/Product");
// Create new category
exports.createCategory = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const category = yield Category_1.Category.create(req.body);
        res.status(201).json({
            success: true,
            category,
        });
    }
    catch (error) {
        // Check for duplicate key error (MongoDB error code 11000)
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A category with this name already exists',
            });
        }
        // Re-throw other errors to be handled by the global error handler
        throw error;
    }
}));
// Get all categories
exports.getAllCategories = (0, catchAsyncErrors_1.catchAsyncErrors)((_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield Category_1.Category.find();
    res.status(200).json({
        success: true,
        categories,
    });
}));
// Get single category
exports.getCategory = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield Category_1.Category.findById(req.params.id);
    if (!category) {
        throw new errorHandler_1.default('Category not found', 404);
    }
    res.status(200).json({
        success: true,
        category,
    });
}));
// Update category
exports.updateCategory = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let category = yield Category_1.Category.findById(req.params.id);
    if (!category) {
        throw new errorHandler_1.default('Category not found', 404);
    }
    category = yield Category_1.Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        success: true,
        category,
    });
}));
// Delete category
exports.deleteCategory = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { moveTo } = req.query; // New parameter to specify target category
    const category = yield Category_1.Category.findById(id);
    if (!category) {
        throw new errorHandler_1.default('Category not found', 404);
    }
    // Check if products are using this category
    const productsCount = yield Product_1.Product.countDocuments({ category: id });
    if (productsCount > 0) {
        // If moveTo parameter is provided, move products to that category
        if (moveTo) {
            // Verify target category exists
            const targetCategory = yield Category_1.Category.findById(moveTo);
            if (!targetCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Target category not found',
                });
            }
            // Move products to the target category
            yield Product_1.Product.updateMany({ category: id }, { $set: { category: moveTo } });
            console.log(`Moved ${productsCount} products to category ${moveTo}`);
        }
        else {
            // If no target category specified, prevent deletion
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${productsCount} products are using this category. Use ?moveTo=categoryId to move products.`,
            });
        }
    }
    yield category.deleteOne();
    res.status(200).json({
        success: true,
        message: productsCount > 0
            ? `Category deleted successfully. ${productsCount} products moved to new category.`
            : 'Category deleted successfully',
    });
}));
