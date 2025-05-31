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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// import cookieParser from 'cookie-parser';
// Load environment variables first
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const express_1 = __importDefault(require("express"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const PaymentRoutes_1 = __importDefault(require("./routes/PaymentRoutes"));
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const initializeAdmin_1 = require("./utils/initializeAdmin");
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
};
// Middleware
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// app.use(cookieParser());
app.use(express_1.default.urlencoded({ extended: true }));
// File upload middleware
app.use((0, express_fileupload_1.default)({
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));
// Routes
app.use('/api', routes_1.default);
app.use('/payments', PaymentRoutes_1.default);
// Error handling middleware
app.use(errorMiddleware_1.errorHandler);
// MongoDB connection with retry logic
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('MongoDB connection string is not defined');
        }
        yield mongoose_1.default.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('Connected to MongoDB successfully');
        // Initialize admin accounts after successful connection
        yield (0, initializeAdmin_1.initializeAdmin)();
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        setTimeout(connectDB, 5000);
    }
});
// Start server only after DB connection
connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
exports.default = app;
