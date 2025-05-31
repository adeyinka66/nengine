"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailConfig = void 0;
exports.emailConfig = {
    smtp: {
        host: 'greenphone-shop.com',
        port: 465,
        secure: true, // true for port 465
        auth: {
            user: 'info@greenphone-shop.com',
            pass: process.env.EMAIL_PASSWORD
        }
    },
    from: {
        name: 'Green Phone Shop',
        email: 'info@greenphone-shop.com'
    }
};
