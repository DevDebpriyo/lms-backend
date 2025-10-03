"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/User.ts
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin', 'parent', 'principal', 'superadmin'],
        default: 'student',
    },
    avatar: { type: String },
    refreshToken: { type: String }, // stored for refresh flow
}, { timestamps: true });
// Hash password before save
UserSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password'))
        return next();
    const salt = await bcrypt_1.default.genSalt(10);
    user.password = await bcrypt_1.default.hash(user.password, salt);
    next();
});
UserSchema.methods.comparePassword = function (candidate) {
    const user = this;
    return bcrypt_1.default.compare(candidate, user.password);
};
exports.default = (0, mongoose_1.model)('User', UserSchema);
