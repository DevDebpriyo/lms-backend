"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = apiKeyAuth;
const bcrypt_1 = __importDefault(require("bcrypt"));
const ApiKey_1 = __importDefault(require("../models/ApiKey"));
const apiKey_1 = require("../utils/apiKey");
function apiKeyAuth(options = {}) {
    const { requireScope } = options;
    return async function (req, res, next) {
        try {
            const header = req.get('x-api-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
            const parsed = (0, apiKey_1.parseApiKey)(header);
            if (!parsed)
                return res.status(401).json({ error: 'invalid_api_key' });
            const { keyId, env, secret } = parsed;
            const record = await ApiKey_1.default.findOne({ keyId, env, 'revoked.isRevoked': false }).lean();
            if (!record)
                return res.status(401).json({ error: 'invalid_api_key' });
            const ok = await bcrypt_1.default.compare(secret, record.keyHash);
            if (!ok)
                return res.status(401).json({ error: 'invalid_api_key' });
            if (requireScope && !(record.scopes || []).includes(requireScope)) {
                return res.status(403).json({ error: 'insufficient_scope' });
            }
            req.apiKey = {
                id: record._id.toString(),
                keyId: record.keyId,
                user: record.user,
                env: record.env,
                scopes: record.scopes,
                plan: record.plan,
                rateLimit: record.rateLimit,
                quota: record.quota,
            };
            return next();
        }
        catch (e) {
            return res.status(500).json({ error: 'api_key_auth_error' });
        }
    };
}
