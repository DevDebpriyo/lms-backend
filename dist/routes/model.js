"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const modelController_1 = __importDefault(require("../controllers/modelController"));
const router = express_1.default.Router();
// POST /api/model/rephrase
router.post('/rephrase', modelController_1.default.rephrase);
router.post('/rephrase-options', modelController_1.default.rephraseOptions);
exports.default = router;
