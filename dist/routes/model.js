"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modelController_1 = __importDefault(require("../controllers/modelController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const quota_1 = __importDefault(require("../middleware/quota"));
const router = express_1.default.Router();
// POST /api/model/rephrase
router.post('/rephrase', auth_1.default, (0, quota_1.default)({ subject: 'user' }), modelController_1.default.rephrase);
router.post('/rephrase-options', auth_1.default, (0, quota_1.default)({ subject: 'user' }), modelController_1.default.rephraseOptions);
// POST /api/model/ai-score
router.post('/ai-score', auth_1.default, (0, quota_1.default)({ subject: 'user' }), modelController_1.default.aiScore);
// POST /api/model/plagiarism-check
router.post('/plagiarism-check', auth_1.default, (0, quota_1.default)({ subject: 'user' }), modelController_1.default.plagiarismCheck);
// POST /api/model/tone-rewrite
router.post('/tone-rewrite', auth_1.default, (0, quota_1.default)({ subject: 'user' }), modelController_1.default.toneRewrite);
exports.default = router;
