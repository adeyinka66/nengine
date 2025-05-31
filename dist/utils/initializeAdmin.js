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
exports.initializeAdmin = void 0;
const User_1 = __importDefault(require("../models/User"));
const initializeAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if any users exist
        const userCount = yield User_1.default.countDocuments();
        if (userCount === 0) {
            // Create superadmin
            const superadmin = new User_1.default({
                firstName: 'Super',
                lastName: 'Admin',
                email: process.env.SUPERADMIN_EMAIL,
                password: process.env.SUPERADMIN_PASSWORD,
                role: 'superadmin',
                isVerified: true
            });
            // Create admin
            const admin = new User_1.default({
                firstName: 'System',
                lastName: 'Admin',
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
                role: 'admin',
                isVerified: true
            });
            yield Promise.all([superadmin.save(), admin.save()]);
            console.log('Superadmin and Admin accounts created successfully');
        }
    }
    catch (error) {
        console.error('Error initializing admin accounts:', error);
    }
});
exports.initializeAdmin = initializeAdmin;
