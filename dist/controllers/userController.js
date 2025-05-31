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
exports.createAdmin = exports.updateUserRole = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getAllUsers = exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.getProfile = exports.generateAdminCreationToken = exports.login = exports.register = exports.passwordResetLimiter = exports.loginLimiter = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const User_1 = __importDefault(require("../models/User"));
const password_validator_1 = __importDefault(require("password-validator"));
const emailService_1 = require("../services/emailService");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const emailService = new emailService_1.EmailService();
// Password schema
const passwordSchema = new password_validator_1.default();
passwordSchema
    .is()
    .min(8)
    .is()
    .max(100)
    .has()
    .uppercase()
    .has()
    .lowercase()
    .has()
    .digits(1)
    .has()
    .symbols(1)
    .has()
    .not()
    .spaces();
// Response messages
const MESSAGES = {
    REGISTRATION: {
        SUCCESS: 'Registration successful! Welcome to Green Phone Shop.',
        FIELDS_REQUIRED: 'First name, last name, email, and password are required',
        INVALID_PASSWORD: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        EMAIL_EXISTS: 'Email already exists',
    },
    AUTH: {
        LOGIN_SUCCESS: 'Login successful',
        INVALID_CREDENTIALS: 'Invalid email or password',
        UNAUTHORIZED: 'Unauthorized access',
        TOKEN_REQUIRED: 'Authentication token is required',
        INVALID_TOKEN: 'Invalid authentication token',
    },
    PASSWORD: {
        RESET_EMAIL_SENT: 'Password reset instructions sent to your email',
        RESET_SUCCESS: 'Password reset successful',
        INVALID_RESET_TOKEN: 'Invalid or expired reset token',
        TOKEN_REQUIRED: 'Reset token is required',
        EMAIL_REQUIRED: 'Email address is required',
        INVALID_PASSWORD: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        EMAIL_SERVICE_ERROR: 'Unable to send password reset email. Please try again later.',
        EMAIL_SEND_ERROR: 'Failed to send password reset email. Please try again later.',
    },
    PROFILE: {
        FETCH_SUCCESS: 'Profile retrieved successfully',
        UPDATE_SUCCESS: 'Profile updated successfully',
        NOT_FOUND: 'User profile not found',
    },
    ADMIN: {
        TOKEN_GENERATED: 'Admin creation token generated successfully',
    },
    RATE_LIMIT: {
        LOGIN: 'Too many login attempts. Please try again after 15 minutes',
        PASSWORD_RESET: 'Too many password reset attempts. Please try again after 1 hour',
    },
    EMAIL: {
        SERVICE_ERROR: 'Email service is currently unavailable',
        SEND_ERROR: 'Failed to send email. Please try again later.',
    },
};
// Rate limiter for login attempts
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // 5 attempts per window
    message: { success: false, message: MESSAGES.RATE_LIMIT.LOGIN },
});
// Rate limiter for password reset attempts
exports.passwordResetLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: { success: false, message: MESSAGES.RATE_LIMIT.PASSWORD_RESET },
});
// Register user
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, phoneNumber, password, adminToken } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields. Please provide the missing information || Incomplete info.',
                error: 'VALIDATION_ERROR',
            });
            return;
        }
        // Determine user role - check for admin token
        let role = 'user';
        if (adminToken) {
            try {
                // Verify admin token
                const decoded = jsonwebtoken_1.default.verify(adminToken, process.env.ADMIN_CREATION_SECRET);
                if (decoded && decoded.purpose === 'admin_creation') {
                    role = 'admin';
                    console.log('Admin account creation authorized');
                }
            }
            catch (error) {
                console.error('Invalid admin token:', error);
                // Continue with user registration, just not as admin
            }
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.',
                error: 'INVALID_EMAIL',
            });
            return;
        }
        // Validate password strength
        if (!passwordSchema.validate(password)) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
                error: 'WEAK_PASSWORD',
            });
            return;
        }
        // Check if user already exists
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'An account with this email already exists. Please use a different email or try logging in.',
                error: 'EMAIL_EXISTS',
            });
            return;
        }
        // Create new user with determined role
        const user = new User_1.default({
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            role, // Use the determined role
            isVerified: true,
        });
        try {
            yield user.save();
        }
        catch (saveError) {
            // Handle mongoose validation errors
            if (saveError.name === 'ValidationError') {
                const validationErrors = Object.values(saveError.errors).map((err) => err.message);
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    error: 'VALIDATION_ERROR',
                    details: validationErrors,
                });
                return;
            }
            throw saveError; // Re-throw other errors to be caught by the outer catch block
        }
        // Send welcome email
        try {
            yield emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`);
        }
        catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue with registration even if email fails
        }
        const _a = user.toObject(), { password: _ } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: `Welcome ${firstName}! Your account has been created successfully.`,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred during registration. Please try again later.',
            error: 'SERVER_ERROR',
        });
    }
});
exports.register = register;
// Login a user
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res
                .status(400)
                .json({ success: false, message: MESSAGES.AUTH.INVALID_CREDENTIALS });
            return;
        }
        const user = yield User_1.default.findOne({ email }).select('+password');
        if (!user) {
            res
                .status(401)
                .json({ success: false, message: MESSAGES.AUTH.INVALID_CREDENTIALS });
            return;
        }
        // console.log('Found user:', {
        //   email: user.email,
        //   hashedPassword: user.password,
        // });
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        // console.log('Password comparison:', {isMatch, providedPassword: password});
        if (!isMatch) {
            res
                .status(401)
                .json({ success: false, message: MESSAGES.AUTH.INVALID_CREDENTIALS });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        // Set token in cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        res.json({
            success: true,
            message: MESSAGES.AUTH.LOGIN_SUCCESS,
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(error);
    }
});
exports.login = login;
// Generate admin creation token
const generateAdminCreationToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            res
                .status(403)
                .json({ success: false, message: MESSAGES.AUTH.UNAUTHORIZED });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ purpose: 'admin_creation' }, process.env.ADMIN_CREATION_SECRET, { expiresIn: '1h' });
        res.json({
            success: true,
            message: MESSAGES.ADMIN.TOKEN_GENERATED,
            data: { adminCreationToken: token },
        });
    }
    catch (error) {
        console.error('Admin creation token generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate admin creation token',
            error: error.message,
        });
        next(error);
    }
});
exports.generateAdminCreationToken = generateAdminCreationToken;
// Get user profile
const getProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res
                .status(401)
                .json({ success: false, message: MESSAGES.AUTH.UNAUTHORIZED });
            return;
        }
        const user = yield User_1.default.findById(req.user._id).select('-password');
        if (!user) {
            res
                .status(404)
                .json({ success: false, message: MESSAGES.PROFILE.NOT_FOUND });
            return;
        }
        res.json({
            success: true,
            message: MESSAGES.PROFILE.FETCH_SUCCESS,
            data: user,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: error.message,
        });
        next(error);
    }
});
exports.getProfile = getProfile;
// Update user profile
const updateProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res
                .status(401)
                .json({ success: false, message: MESSAGES.AUTH.UNAUTHORIZED });
            return;
        }
        const { firstName, lastName, email } = req.body;
        if (!firstName && !lastName && !email) {
            res
                .status(400)
                .json({ success: false, message: 'No update data provided' });
            return;
        }
        const user = yield User_1.default.findByIdAndUpdate(req.user._id, { firstName, lastName, email }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res
                .status(404)
                .json({ success: false, message: MESSAGES.PROFILE.NOT_FOUND });
            return;
        }
        res.json({
            success: true,
            message: MESSAGES.PROFILE.UPDATE_SUCCESS,
            data: user,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
        next(error);
    }
});
exports.updateProfile = updateProfile;
// Forgot Password
exports.forgotPassword = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield User_1.default.findOne({ email });
    if (!user) {
        return next(new errorHandler_1.default('User not found with this email', 404));
    }
    // Generate reset token
    const resetToken = crypto_1.default.randomBytes(20).toString('hex');
    // Hash and set to resetPasswordToken
    user.resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    // Set token expiry time
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    yield user.save({ validateBeforeSave: false });
    try {
        yield emailService.sendPasswordResetEmail(user.email, resetToken);
        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`,
        });
    }
    catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        yield user.save({ validateBeforeSave: false });
        return next(new errorHandler_1.default('Email could not be sent', 500));
    }
}));
// Reset Password
exports.resetPassword = (0, catchAsyncErrors_1.catchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Get hashed token
    const resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = yield User_1.default.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(new errorHandler_1.default('Password reset token is invalid or has expired', 400));
    }
    if (req.body.password !== req.body.confirmPassword) {
        return next(new errorHandler_1.default('Passwords do not match', 400));
    }
    // Setup new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    yield user.save();
    res.status(200).json({
        success: true,
        message: 'Password updated successfully',
    });
}));
// Admin: Get all users
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find({});
        const usersWithoutPassword = users.map(user => {
            const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
            return userWithoutPassword;
        });
        res.status(200).json({
            success: true,
            data: usersWithoutPassword,
            message: 'Users retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllUsers = getAllUsers;
// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
};
// Admin: Get user by ID
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
            return;
        }
        const user = yield User_1.default.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.status(200).json({
            success: true,
            data: userWithoutPassword,
            message: 'User retrieved successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserById = getUserById;
// Admin: Update user
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, role, isVerified } = req.body;
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
            return;
        }
        // Check if user exists
        const user = yield User_1.default.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        // Validate email uniqueness if it's being changed
        if (email && email !== user.email) {
            const existingUser = yield User_1.default.findOne({ email, _id: { $ne: id } });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: 'Email is already in use',
                });
                return;
            }
        }
        // Update user fields
        const updateData = {};
        if (firstName)
            updateData.firstName = firstName;
        if (lastName)
            updateData.lastName = lastName;
        if (email)
            updateData.email = email;
        if (role)
            updateData.role = role;
        if (typeof isVerified === 'boolean')
            updateData.isVerified = isVerified;
        const updatedUser = yield User_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        const _a = updatedUser.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.status(200).json({
            success: true,
            data: userWithoutPassword,
            message: 'User updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUser = updateUser;
// Admin: Delete user
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
            return;
        }
        const user = yield User_1.default.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        // Prevent deletion of super admin
        if (user.role === 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Super admin account cannot be deleted',
            });
            return;
        }
        yield user.deleteOne();
        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteUser = deleteUser;
// Admin: Update user role
const updateUserRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role } = req.body;
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid user ID format',
            });
            return;
        }
        // Validate role
        const validRoles = ['user', 'moderator', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            res.status(400).json({
                success: false,
                message: `Invalid role specified. Valid roles are: ${validRoles.join(', ')}`,
            });
            return;
        }
        const user = yield User_1.default.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        // Prevent role change for super admin
        if (user.role === 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Super admin role cannot be modified',
            });
            return;
        }
        // Prevent elevation to super admin
        if (role === 'superadmin') {
            res.status(403).json({
                success: false,
                message: 'Cannot elevate user to super admin role',
            });
            return;
        }
        user.role = role;
        yield user.save();
        const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.status(200).json({
            success: true,
            data: userWithoutPassword,
            message: 'User role updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUserRole = updateUserRole;
// Create admin user (requires admin token)
const createAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, password, adminToken } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !adminToken) {
            res.status(400).json({
                success: false,
                message: 'All fields and admin token are required',
                error: 'VALIDATION_ERROR',
            });
            return;
        }
        // Validate admin token
        try {
            const decoded = jsonwebtoken_1.default.verify(adminToken, process.env.ADMIN_CREATION_SECRET);
            if (!decoded.purpose ||
                decoded.purpose !== 'admin_creation') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid admin creation token',
                    error: 'UNAUTHORIZED',
                });
                return;
            }
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired admin creation token',
                error: 'UNAUTHORIZED',
            });
            return;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.',
                error: 'INVALID_EMAIL',
            });
            return;
        }
        // Validate password strength
        if (!passwordSchema.validate(password)) {
            res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
                error: 'WEAK_PASSWORD',
            });
            return;
        }
        // Check if user already exists
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
                error: 'EMAIL_EXISTS',
            });
            return;
        }
        // Create admin user
        const user = new User_1.default({
            firstName,
            lastName,
            email,
            password,
            role: 'admin',
            isVerified: true,
        });
        yield user.save();
        // Send welcome email
        try {
            yield emailService.sendWelcomeEmail(email, `${firstName} ${lastName}`);
        }
        catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Continue with registration even if email fails
        }
        const _a = user.toObject(), { password: _ } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.status(201).json({
            success: true,
            data: userWithoutPassword,
            message: `Admin account for ${firstName} created successfully.`,
        });
    }
    catch (error) {
        console.error('Admin creation error:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred during admin creation. Please try again later.',
            error: 'SERVER_ERROR',
        });
    }
});
exports.createAdmin = createAdmin;
