"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dodopayments = exports.dodoMeta = void 0;
const dodopayments_1 = __importDefault(require("dodopayments"));
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
