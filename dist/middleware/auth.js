"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
