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
exports.getAllOrders = exports.getOrderStats = exports.getOrdersByDateRange = exports.cancelOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
const crypto_1 = __importDefault(require("crypto"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const emailService_1 = require("../services/emailService");
const User_1 = __importDefault(require("../models/User"));
const emailService = new emailService_1.EmailService(); // Create instance
// Helper function to generate order number
function generateOrderNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lastOrder = yield Order_1.default.findOne().sort({ createdAt: -1 });
            if (!lastOrder || !lastOrder.orderNumber) {
                return 'ORD-0001';
            }
            const matches = lastOrder.orderNumber.match(/ORD-(\d+)/);
            if (!matches) {
                return 'ORD-0001';
            }
            const lastNumber = parseInt(matches[1]);
            const nextNumber = lastNumber + 1;
            return `ORD-${nextNumber.toString().padStart(4, '0')}`;
        }
        catch (error) {
            // Fallback to timestamp-based number if something goes wrong
            const timestamp = Date.now();
            return `ORD-${timestamp}`;
        }
    });
}
// Helper function to generate payment ID
function generatePaymentId() {
    return `PAY-${crypto_1.default.randomBytes(8).toString('hex')}-${Date.now()}`;
}
// Create a new order
exports.createOrder = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            res
                .status(401)
                .json({ success: false, message: 'User not authenticated' });
            return;
        }
        // Get user details from database
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        console.log('User making order:', {
            userId: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
        });
        const { cartId, shippingAddress, paymentId, orderId, paymentStatus } = req.body;
        const cart = yield Cart_1.default.findById(cartId).populate('items.product');
        if (!cart || cart.items.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Cart is empty or not found',
            });
            return;
        }
        // Calculate subtotal (original amount before discount)
        const subtotal = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
        // Get discount information from the cart
        const discountCode = cart.discountCode || null;
        const discountAmount = cart.discountAmount || 0;
        // Calculate total amount (after applying discount)
        const totalAmount = subtotal - discountAmount;
        // Generate order number
        const orderNumber = yield generateOrderNumber();
        // Generate unique payment ID for testing
        const actualPaymentId = paymentId || generatePaymentId();
        // Create order items from cart items
        const orderItems = cart.items.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            price: item.price,
        }));
        // Create the order
        const order = new Order_1.default({
            orderNumber,
            user: userId,
            items: orderItems,
            orderId: orderId,
            subtotal, // Save original amount before discount
            discountCode, // Save the discount code used
            discountAmount, // Save the discount amount applied
            totalAmount, // Save the final amount after discount
            shippingAddress: Object.assign(Object.assign({}, shippingAddress), { phone: shippingAddress.phone.toString() }),
            payment: {
                provider: 'paypal',
                transactionId: actualPaymentId,
                status: 'completed',
                paidAmount: totalAmount,
                paidAt: new Date(),
            },
            paymentStatus: paymentStatus,
        });
        yield order.save();
        // Send order confirmation email to customer
        console.log('Sending order confirmation to:', user.email);
        yield emailService.sendOrderConfirmationEmail(user.email, {
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            items: cart.items,
            total: order.totalAmount,
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            discountCode: order.discountCode,
            shippingAddress: order.shippingAddress,
            siteName: 'Green Phone Shop',
            year: new Date().getFullYear(),
        });
        console.log('Order confirmation email sent');
        // Send notification to admin
        yield emailService.sendAdminOrderNotificationEmail({
            orderNumber: order._id,
            customerName: `${user.firstName} ${user.lastName}`,
            orderDate: order.createdAt,
            total: order.totalAmount,
        });
        // Clear the cart after successful order creation
        yield Cart_1.default.findByIdAndDelete(cartId);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order,
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        next(error);
    }
}));
// Get all orders for a user
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { status } = req.query;
        const query = { user: userId };
        if (status) {
            query.status = status;
        }
        const orders = yield Order_1.default.find(query)
            .sort({ createdAt: -1 })
            .populate('items.productId');
        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving orders',
            error: error.message,
        });
    }
});
exports.getOrders = getOrders;
// Get specific order by ID
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const order = yield Order_1.default.findOne({ _id: id, user: userId }).populate('items.productId');
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Order retrieved successfully',
            data: order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving order',
            error: error.message,
        });
    }
});
exports.getOrderById = getOrderById;
// Update order status
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        // Validate status
        const validStatuses = [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
        ];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
            return;
        }
        const order = yield Order_1.default.findOneAndUpdate({ _id: id, user: userId }, Object.assign({ status, updatedAt: new Date() }, (status === 'cancelled' && { cancelledAt: new Date() })), { new: true });
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message,
        });
    }
});
exports.updateOrderStatus = updateOrderStatus;
// Cancel order
const cancelOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { cancelReason } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const order = (yield Order_1.default.findOne({ _id: id, user: userId }));
        if (!order) {
            res.status(404).json({
                success: false,
                message: 'Order not found',
            });
            return;
        }
        if (order.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Only pending orders can be cancelled',
            });
            return;
        }
        const updatedOrder = yield Order_1.default.findByIdAndUpdate(id, {
            $set: {
                status: 'cancelled',
                cancelReason: cancelReason || 'Cancelled by user',
                cancelledAt: new Date(),
            },
        }, { new: true });
        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: updatedOrder,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message,
        });
    }
});
exports.cancelOrder = cancelOrder;
// Get orders by date range
const getOrdersByDateRange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { startDate, endDate } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!startDate || !endDate) {
            res.status(400).json({
                success: false,
                message: 'Start date and end date are required',
            });
            return;
        }
        const orders = yield Order_1.default.find({
            user: userId,
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            },
        }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving orders',
            error: error.message,
        });
    }
});
exports.getOrdersByDateRange = getOrdersByDateRange;
// Get order statistics
const getOrderStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const [stats, ordersByStatus] = yield Promise.all([
            Order_1.default.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: '$totalAmount' },
                        averageOrderValue: { $avg: '$totalAmount' },
                    },
                },
            ]),
            Order_1.default.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);
        res.status(200).json({
            success: true,
            message: 'Order statistics retrieved successfully',
            data: {
                stats: stats[0] || {
                    totalOrders: 0,
                    totalSpent: 0,
                    averageOrderValue: 0,
                },
                ordersByStatus: ordersByStatus.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving order statistics',
            error: error.message,
        });
    }
});
exports.getOrderStats = getOrderStats;
// Get all orders (admin only)
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // Check if user is admin
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            res.status(403).json({
                success: false,
                message: 'Only admins can access all orders',
            });
            return;
        }
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const status = req.query.status;
        const startDate = req.query.startDate
            ? new Date(req.query.startDate)
            : null;
        const endDate = req.query.endDate
            ? new Date(req.query.endDate)
            : null;
        // Build filter object
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = startDate;
            }
            if (endDate) {
                filter.createdAt.$lte = endDate;
            }
        }
        // Calculate skip value for pagination
        const skip = (page - 1) * limit;
        // Get total count for pagination
        const totalOrders = yield Order_1.default.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);
        // Get orders with pagination and sorting
        const orders = yield Order_1.default.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('user', 'firstName lastName email')
            .populate('items.productId', 'name price');
        res.json({
            success: true,
            message: 'Orders retrieved successfully',
            data: {
                orders,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalOrders,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message,
        });
    }
});
exports.getAllOrders = getAllOrders;
