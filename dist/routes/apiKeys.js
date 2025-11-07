"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = __importDefault(require("../middleware/auth"));
const ApiKey_1 = __importDefault(require("../models/ApiKey"));
const apiKey_1 = require("../utils/apiKey");
const router = (0, express_1.Router)();
// Require app auth (JWT) to manage keys
router.use(auth_1.default);
// Create a new API key
router.post('/', async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'unauthorized' });
        const { name = 'Default key', env, scopes = ['inference:run'] } = (req.body || {});
        const { apiKey, keyId, secret, env: resolvedEnv } = (0, apiKey_1.generateApiKey)({ env });
        const keyHash = await bcrypt_1.default.hash(secret, 12);
        const doc = await ApiKey_1.default.create({
            user: userId,
            name,
            keyId,
            keyHash,
            env: resolvedEnv,
            scopes,
        });
        return res.status(201).json({
            id: doc._id,
            name: doc.name,
            env: doc.env,
            key: apiKey, // only return once!
            scopes: doc.scopes,
            createdAt: doc.createdAt,
        });
    }
    catch (e) {
        return res.status(500).json({ error: 'failed_to_create_key' });
    }
});
// List API keys (masked)
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'unauthorized' });
        const keys = await ApiKey_1.default.find({ user: userId })
            .select('name env keyId scopes createdAt lastUsedAt revoked rateLimit quota')
            .lean();
        // Mask presentation: show only keyId, not the secret
        return res.json({ keys });
    }
    catch (e) {
        return res.status(500).json({ error: 'failed_to_list_keys' });
    }
});
// Revoke an API key
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId)
            return res.status(401).json({ error: 'unauthorized' });
        const { id } = req.params;
        const doc = await ApiKey_1.default.findOneAndUpdate({ _id: id, user: userId, 'revoked.isRevoked': false }, { $set: { revoked: { isRevoked: true, revokedAt: new Date(), reason: 'user_revoked' } } }, { new: true });
        if (!doc)
            return res.status(404).json({ error: 'not_found' });
        return res.json({ revoked: true, id: doc._id });
    }
    catch (e) {
        return res.status(500).json({ error: 'failed_to_revoke_key' });
    }
});
exports.default = router;
