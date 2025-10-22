"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dodopayments = void 0;
const dodopayments_1 = __importDefault(require("dodopayments"));
exports.dodopayments = new dodopayments_1.default({
    bearerToken: process.env.NODE_ENV === "development"
        ? process.env.DODO_API_KEY_TEST
        : process.env.DODO_API_KEY_LIVE, // This is the default and can be omitted if env is named as DODO_PAYMENTS_API_KEY
    environment: process.env.NODE_ENV === "development" ? "test_mode" : "live_mode", // defaults to 'live_mode'
});
