"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dodopayments = void 0;
const dodopayments_1 = __importDefault(require("dodopayments"));
const isProd = process.env.NODE_ENV === 'production';
exports.dodopayments = new dodopayments_1.default({
    bearerToken: isProd ? process.env.DODO_API_KEY_LIVE : process.env.DODO_API_KEY_TEST,
    environment: isProd ? 'live_mode' : 'test_mode',
});
exports.default = exports.dodopayments;
