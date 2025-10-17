"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
router.post('/register', authController_1.register); // sign up
router.post('/login', authController_1.login); // sign in
router.post('/refresh', authController_1.refreshAccessToken);
router.post('/logout', authController_1.logout); // sign out
router.get('/me', auth_1.default, authController_1.me); // profiles tab
exports.default = router;
