"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dodopayments = exports.dodoMeta = void 0;
const dodopayments_1 = __importDefault(require("dodopayments"));
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure local .env is loaded when this module is required early (e.g. before server.ts runs dotenv)
// This mirrors server.ts behavior: use .env.prod in production, .env otherwise.
if (!process.env.DODO_API_KEY_TEST && !process.env.DODO_API_KEY_LIVE && !process.env.DODO_PAYMENTS_API_KEY) {
    try {
        if (process.env.NODE_ENV === 'production') {
            dotenv_1.default.config({ path: '.env.prod' });
        }
        else {
            dotenv_1.default.config({ path: '.env' });
        }
    }
    catch (e) {
        // ignore - config is best-effort
    }
}
// Flexible environment selection:
// - DODO_ENV=test|live overrides mode.
// - Else if DODO_API_KEY_LIVE exists, use live_mode; otherwise use test_mode.
// This decouples Dodo mode from NODE_ENV so you can test in production deploys.
const liveKey = process.env.DODO_API_KEY_LIVE;
const testKey = process.env.DODO_API_KEY_TEST;
const dodoEnv = (process.env.DODO_ENV || '').toLowerCase();
let mode;
let token;
if (dodoEnv === 'live') {
    mode = 'live_mode';
    token = liveKey;
}
else if (dodoEnv === 'test') {
    mode = 'test_mode';
    token = testKey;
}
else if (liveKey) {
    mode = 'live_mode';
    token = liveKey;
}
else {
    mode = 'test_mode';
    token = testKey;
}
exports.dodoMeta = {
    mode,
    using: mode === 'live_mode' ? 'live' : 'test',
    hasLiveKey: Boolean(liveKey),
    hasTestKey: Boolean(testKey),
};
exports.dodopayments = new dodopayments_1.default({
    bearerToken: token,
    environment: mode,
});
exports.default = exports.dodopayments;
