"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = require("express-rate-limit");
const db_1 = __importDefault(require("./config/db"));
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// middlewares
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true, // allow cookies
}));
// limit brute-force
app.use((0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
}));
// routes
app.use('/api/auth', auth_1.default);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 5000;
const start = async () => {
    await (0, db_1.default)();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
};
start();
