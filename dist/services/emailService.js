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
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class EmailError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'EmailError';
    }
}
class EmailService {
    constructor() {
        console.log('Initializing EmailService with Gmail...');
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        // Check for required environment variables
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.error('Missing Gmail credentials in environment variables');
            throw new Error('Email configuration is incomplete');
        }
        // Initialize Gmail SMTP transporter
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        // Verify connection
        this.transporter.verify(error => {
            var _a;
            if (error) {
                console.error('Gmail connection error:', error);
                console.log('Gmail credentials:', {
                    user: process.env.GMAIL_USER,
                    pass: ((_a = process.env.GMAIL_APP_PASSWORD) === null || _a === void 0 ? void 0 : _a.substring(0, 4)) + '****' // Log partially hidden password
                });
            }
            else {
                console.log('Gmail server is ready to send emails');
            }
        });
        this.templates = this.loadTemplates();
    }
    loadTemplates() {
        console.log('Loading email templates...');
        const templates = new Map();
        const templateNames = [
            'order-confirmation',
            'order-status-update',
            'admin-order-notification',
            'password-reset',
            'welcome-email',
        ];
        templateNames.forEach(name => {
            const templatePath = path.join(__dirname, `../templates/${name}.hbs`);
            console.log(`Looking for template: ${templatePath}`);
            if (fs.existsSync(templatePath)) {
                try {
                    const templateContent = fs.readFileSync(templatePath, 'utf-8');
                    templates.set(name, handlebars_1.default.compile(templateContent));
                    console.log(`Successfully loaded template: ${name}`);
                }
                catch (error) {
                    console.error(`Error loading template ${name}:`, error);
                }
            }
            else {
                console.error(`Template not found: ${templatePath}`);
            }
        });
        console.log(`Loaded ${templates.size}/${templateNames.length} templates`);
        return templates;
    }
    sendEmail(_a) {
        return __awaiter(this, arguments, void 0, function* ({ to, subject, template, data, }) {
            try {
                const templateFn = this.templates.get(template);
                if (!templateFn) {
                    throw new EmailError(`Template ${template} not found`, 'TEMPLATE_ERROR');
                }
                const html = templateFn(data);
                const mailOptions = {
                    from: {
                        name: process.env.MAIL_FROM_NAME || 'Green Phone Shop',
                        address: process.env.GMAIL_USER, // Use your Gmail address
                    },
                    to: to,
                    subject: subject,
                    html: html,
                };
                console.log('Attempting to send email to:', to);
                const result = yield this.transporter.sendMail(mailOptions);
                console.log('Email sent successfully:', result.messageId);
            }
            catch (error) {
                console.error('Failed to send email:', error);
                throw new EmailError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 'SMTP_ERROR');
            }
        });
    }
    sendWelcomeEmail(email, fullName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Preparing welcome email for:', fullName);
            const template = this.templates.get('welcome-email');
            if (!template) {
                console.error('Welcome email template not found!');
                throw new EmailError('Template welcome-email not found', 'TEMPLATE_ERROR');
            }
            const templateData = {
                fullName,
                email,
                shopUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
                year: new Date().getFullYear(),
                address: process.env.COMPANY_ADDRESS || 'Your Eco-Friendly Phone Shop',
            };
            console.log('Template data:', templateData);
            const html = template(templateData);
            console.log('Generated HTML length:', html.length);
            yield this.sendEmail({
                to: email,
                subject: 'Welcome to Green Phone Shop! 🌱📱',
                template: 'welcome-email',
                data: templateData,
            });
        });
    }
    sendPasswordResetEmail(to, resetToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
            yield this.sendEmail({
                to,
                subject: 'Password Reset Request - Green Phone Shop',
                template: 'password-reset',
                data: {
                    resetUrl,
                    resetToken,
                    userName: to.split('@')[0],
                    validityPeriod: '30 minutes',
                    siteName: 'Green Phone Shop',
                    year: new Date().getFullYear(),
                },
            });
        });
    }
    sendOrderConfirmationEmail(to, orderData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendEmail({
                to,
                subject: 'Order Confirmation',
                template: 'order-confirmation',
                data: Object.assign(Object.assign({}, orderData), { siteName: 'Green Phone Shop' }),
            });
        });
    }
    sendOrderStatusUpdateEmail(to, statusData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendEmail({
                to,
                subject: `Order Status Update: ${statusData.status}`,
                template: 'order-status-update',
                data: Object.assign(Object.assign({}, statusData), { siteName: 'Green Phone Shop' }),
            });
        });
    }
    sendAdminOrderNotificationEmail(orderData) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
            yield this.sendEmail({
                to: adminEmail,
                subject: `New Order Received: #${orderData.orderNumber}`,
                template: 'admin-order-notification',
                data: Object.assign(Object.assign({}, orderData), { siteName: 'Green Phone Shop' }),
            });
        });
    }
}
exports.EmailService = EmailService;
