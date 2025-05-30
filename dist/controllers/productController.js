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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByCategory = exports.submitReview = exports.deleteProduct = exports.updateProductImages = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const Product_1 = require("../models/Product");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const Category_1 = require("../models/Category");
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
// Helper function to calculate effective price
const getEffectivePrice = (product) => {
    const now = new Date();
    const hasValidDiscount = product.discountPrice &&
        (!product.discountStartDate || now >= product.discountStartDate) &&
        (!product.discountEndDate || now <= product.discountEndDate);
    return {
        effectivePrice: hasValidDiscount && product.discountPrice
            ? product.discountPrice
            : product.price,
        onSale: hasValidDiscount && product.discountPrice ? true : false,
    };
};
// Get all products
const getAllProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield Product_1.Product.find().populate('category', 'name description');
        // Add effectivePrice to each product
        const productsWithEffectivePrice = products.map(product => {
            const { effectivePrice, onSale } = getEffectivePrice(product);
            const productObj = product.toObject();
            return Object.assign(Object.assign({}, productObj), { effectivePrice,
                onSale });
        });
        res.status(200).json({
            success: true,
            data: productsWithEffectivePrice,
            message: 'Products retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message,
        });
        next(error);
    }
});
exports.getAllProducts = getAllProducts;
// Get product by ID
const getProductById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        // Add effectivePrice to product
        const { effectivePrice, onSale } = getEffectivePrice(product);
        const productObj = product.toObject();
        const productWithEffectivePrice = Object.assign(Object.assign({}, productObj), { effectivePrice,
            onSale });
        res.status(200).json({
            success: true,
            data: productWithEffectivePrice,
            message: 'Product retrieved successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving product',
            error: error.message,
        });
        next(error);
    }
});
exports.getProductById = getProductById;
const createProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, color, storage, price, discountPrice, discountStartDate, discountEndDate, stock, category, } = req.body;
        // Verify category exists
        const categoryExists = yield Category_1.Category.findById(category);
        if (!categoryExists) {
            res.status(400).json({
                success: false,
                message: 'Invalid category ID',
            });
            return;
        }
        // Type check for files
        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Main image is required',
            });
            return;
        }
        const files = req.files;
        const mainImageFile = files.mainImage;
        if (!mainImageFile) {
            res.status(400).json({
                success: false,
                message: 'Main image is required',
            });
            return;
        }
        // Upload main image to Cloudinary
        const mainImageUpload = yield cloudinary_1.default.uploader.upload(mainImageFile.tempFilePath, {
            folder: 'products',
            transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        });
        let images = [];
        // Handle additional images if they exist
        if (files.images) {
            const imageFiles = Array.isArray(files.images)
                ? files.images
                : [files.images];
            // Upload additional images
            for (const file of imageFiles) {
                const result = yield cloudinary_1.default.uploader.upload(file.tempFilePath, {
                    folder: 'products',
                    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
                });
                images.push(result.secure_url);
            }
        }
        // Create product with uploaded images
        const product = new Product_1.Product(Object.assign(Object.assign(Object.assign({ name,
            description,
            color,
            storage, price: parseFloat(price), stock: parseInt(stock, 10), mainImage: mainImageUpload.secure_url, images,
            category }, (discountPrice && { discountPrice: parseFloat(discountPrice) })), (discountStartDate && {
            discountStartDate: new Date(discountStartDate),
        })), (discountEndDate && { discountEndDate: new Date(discountEndDate) })));
        yield product.save();
        res.status(201).json({
            success: true,
            data: product,
            message: 'Product created successfully',
        });
    }
    catch (error) {
        console.error('Error in createProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong while creating the product',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.createProduct = createProduct;
const updateProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { price, discountPrice, discountStartDate, discountEndDate } = _a, otherFields = __rest(_a, ["price", "discountPrice", "discountStartDate", "discountEndDate"]);
        // Process numeric and date fields
        const updateData = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, otherFields), (price !== undefined && { price: parseFloat(price) })), (discountPrice !== undefined && {
            discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        })), (discountStartDate !== undefined && {
            discountStartDate: discountStartDate
                ? new Date(discountStartDate)
                : null,
        })), (discountEndDate !== undefined && {
            discountEndDate: discountEndDate ? new Date(discountEndDate) : null,
        }));
        const updatedProduct = yield Product_1.Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedProduct) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        // Add effective price calculation to response
        const { effectivePrice, onSale } = getEffectivePrice(updatedProduct);
        const productWithEffectivePrice = Object.assign(Object.assign({}, updatedProduct.toObject()), { effectivePrice,
            onSale });
        res.status(200).json({
            success: true,
            data: productWithEffectivePrice,
            message: 'Product updated successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message,
        });
        next(error);
    }
});
exports.updateProduct = updateProduct;
const updateProductImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: 'Product not found',
            });
            return;
        }
        if (!req.files || Object.keys(req.files).length === 0) {
            res.status(400).json({
                success: false,
                message: 'No images provided for update',
            });
            return;
        }
        const files = req.files;
        // Handle main image update
        if (files.mainImage) {
            const mainImageFile = files.mainImage;
            // Upload new main image
            const mainImageUpload = yield cloudinary_1.default.uploader.upload(mainImageFile.tempFilePath, {
                folder: 'products',
                transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
            });
            // Update product with new main image URL
            product.mainImage = mainImageUpload.secure_url;
        }
        // Handle additional images update
        if (files.images) {
            const imageFiles = Array.isArray(files.images)
                ? files.images
                : [files.images];
            // Upload new additional images
            const newImages = [];
            for (const file of imageFiles) {
                const result = yield cloudinary_1.default.uploader.upload(file.tempFilePath, {
                    folder: 'products',
                    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
                });
                newImages.push(result.secure_url);
            }
            // Update product with new image URLs
            product.images = newImages;
        }
        yield product.save();
        res.status(200).json({
            success: true,
            data: product,
            message: 'Product images updated successfully',
        });
    }
    catch (error) {
        console.error('Error in updateProductImages:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product images',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
});
exports.updateProductImages = updateProductImages;
const deleteProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield Product_1.Product.findById(req.params.id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        // Delete images from Cloudinary
        if (product.mainImage) {
            yield cloudinary_1.default.uploader.destroy(product.mainImage);
        }
        for (const image of product.images) {
            if (image) {
                yield cloudinary_1.default.uploader.destroy(image);
            }
        }
        yield Product_1.Product.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product and associated images deleted successfully',
        });
    }
    catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
});
exports.deleteProduct = deleteProduct;
const submitReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { productId } = req.params;
        const { rating } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'User not authenticated' });
            return;
        }
        const product = yield Product_1.Product.findById(productId);
        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return;
        }
        // Update product rating
        product.rating =
            (product.rating * product.totalReviews + rating) /
                (product.totalReviews + 1);
        product.totalReviews += 1;
        yield product.save();
        res.status(201).json({
            success: true,
            data: product,
            message: 'Review submitted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting review',
            error: error.message,
        });
        next(error);
    }
});
exports.submitReview = submitReview;
// Add this new function to get products by category
exports.getProductsByCategory = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.categoryId;
        const { sort, minPrice, maxPrice } = req.query;
        // Verify category exists
        const category = yield Category_1.Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        // Build query
        let query = Product_1.Product.find({ category: categoryId });
        // Apply price filters if provided
        if (minPrice || maxPrice) {
            const priceFilter = {};
            if (minPrice)
                priceFilter.$gte = Number(minPrice);
            if (maxPrice)
                priceFilter.$lte = Number(maxPrice);
            query = query.where('price').equals(priceFilter);
        }
        // Apply sorting if provided
        if (sort) {
            const sortOrder = sort === 'desc' ? -1 : 1;
            query = query.sort({ price: sortOrder });
        }
        // Execute query with category population
        const products = yield query.populate('category', 'name description');
        // Add effectivePrice to product
        const productsWithEffectivePrice = products.map(product => {
            const { effectivePrice, onSale } = getEffectivePrice(product);
            const productObj = product.toObject();
            return Object.assign(Object.assign({}, productObj), { effectivePrice,
                onSale });
        });
        res.status(200).json({
            success: true,
            data: productsWithEffectivePrice,
            message: `Products in category: ${category.name}`,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}));
