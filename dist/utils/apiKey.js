"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = generateApiKey;
exports.parseApiKey = parseApiKey;
const crypto_1 = __importDefault(require("crypto"));
const nanoid_1 = require("nanoid");
const nano = (0, nanoid_1.customAlphabet)('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12);
function generateApiKey(opts) {
    const env = opts?.env ?? (process.env.API_KEY_DEFAULT_ENV || 'test');
    const prefix = opts?.prefix ?? (process.env.API_KEY_PREFIX || 'sk');
    const bytes = opts?.bytes ?? Number(process.env.API_KEY_BYTES || 32);
    const keyId = nano();
    const secret = crypto_1.default.randomBytes(bytes).toString('base64url');
    const apiKey = `${prefix}_${env}_${keyId}.${secret}`;
    return { apiKey, keyId, secret, env };
}
function parseApiKey(raw) {
    if (!raw)
        return null;
    const m = /^([a-zA-Z]{2})_(test|live)_([^.]+)\.(.+)$/.exec(raw.trim());
    if (!m)
        return null;
    const [, prefix, env, keyId, secret] = m;
    return { prefix, env, keyId, secret };
}
