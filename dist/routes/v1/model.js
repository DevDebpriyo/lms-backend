"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apiKeyAuth_1 = __importDefault(require("../../middleware/apiKeyAuth"));
const rateLimitByKey_1 = __importDefault(require("../../middleware/rateLimitByKey"));
const modelController_1 = __importDefault(require("../../controllers/modelController"));
const router = express_1.default.Router();
// API-key protected versions of model endpoints
router.post('/model/rephrase', (0, apiKeyAuth_1.default)({ requireScope: 'inference:run' }), (0, rateLimitByKey_1.default)(), modelController_1.default.rephrase);
router.post('/model/rephrase-options', (0, apiKeyAuth_1.default)({ requireScope: 'inference:run' }), (0, rateLimitByKey_1.default)(), modelController_1.default.rephraseOptions);
router.post('/model/ai-score', (0, apiKeyAuth_1.default)({ requireScope: 'inference:run' }), (0, rateLimitByKey_1.default)(), modelController_1.default.aiScore);
router.post('/model/plagiarism-check', (0, apiKeyAuth_1.default)({ requireScope: 'inference:run' }), (0, rateLimitByKey_1.default)(), modelController_1.default.plagiarismCheck);
router.post('/model/tone-rewrite', (0, apiKeyAuth_1.default)({ requireScope: 'inference:run' }), (0, rateLimitByKey_1.default)(), modelController_1.default.toneRewrite);
exports.default = router;
