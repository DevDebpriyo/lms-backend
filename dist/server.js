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
const model_1 = __importDefault(require("./routes/model"));
const payments_1 = __importDefault(require("./routes/payments"));
const apiKeys_1 = __importDefault(require("./routes/apiKeys"));
const model_2 = __importDefault(require("./routes/v1/model"));
// Load environment variables.
// Use `.env.prod` for production and `.env` for development (these files exist in the repo).
if (process.env.NODE_ENV === 'production') {
    dotenv_1.default.config({ path: '.env.prod' });
    console.log('Loaded environment from .env.prod');
}
else {
    // default development file in this repo is `.env`
    dotenv_1.default.config({ path: '.env' });
    console.log('Loaded environment from .env');
}
const app = (0, express_1.default)();
// middlewares
app.use((0, helmet_1.default)());
// Raw body ONLY for webhook verification (must be before express.json)
app.use('/api/payments/webhook', express_1.default.raw({ type: '*/*' }));
// JSON parser for the rest of the app
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Allow credentials and an exact list of allowed origins (no trailing slashes)
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'https://authenti-text.vercel.app/')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // non-browser or same-origin
        const normalized = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalized))
            return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
}));
// limit brute-force
app.use((0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
}));
// routes
app.use('/api/auth', auth_1.default);
// temporary alias to support clients calling "/auth" without the "/api" prefix
app.use('/auth', auth_1.default);
// model routes
app.use('/api/model', model_1.default);
// payments routes
app.use('/api/payments', payments_1.default);
// API key management (requires user auth via JWT)
app.use('/api/keys', apiKeys_1.default);
// Public developer API (v1) guarded by API keys
app.use('/v1', model_2.default);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
const PORT = process.env.PORT || 5000;
const start = async () => {
    await (0, db_1.default)();
    app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
};
start();
