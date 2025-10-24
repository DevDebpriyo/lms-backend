"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plagiarismCheck = exports.aiScore = exports.rephraseOptions = exports.rephrase = void 0;
const client_1 = require("@gradio/client");
// Contract:
// - Input: JSON body { text: string }
// - Output: JSON { ok: boolean, data?: any, error?: string }
const HF_MODEL = process.env.HF_GRADIO_MODEL || 'DTabs/rephrase';
const HF_SCORE_MODEL = process.env.HF_GRADIO_SCORE_MODEL || 'DTabs/AI_score';
const HF_PLAGIARISM_MODEL = process.env.HF_GRADIO_PLAGIARISM_MODEL || 'DTabs/AI_score';
const rephrase = async (req, res) => {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
    }
    let client;
    try {
        client = await client_1.Client.connect(HF_MODEL);
    }
    catch (err) {
        console.error('Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        const result = await client.predict('/predict', { text });
        // The Gradio result typically contains `data` array. Return it as-is for now.
        return res.json({ ok: true, data: result?.data ?? result });
    }
    catch (err) {
        console.error('Prediction error', err);
        return res.status(500).json({ ok: false, error: 'Model inference failed' });
    }
};
exports.rephrase = rephrase;
const rephraseOptions = async (req, res) => {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
    }
    let client;
    try {
        client = await client_1.Client.connect(HF_MODEL);
    }
    catch (err) {
        console.error('Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        // This endpoint differs by using the '/predict_1' path for options output
        const result = await client.predict('/predict_1', { text });
        return res.json({ ok: true, data: result?.data ?? result });
    }
    catch (err) {
        console.error('Prediction error (options)', err);
        return res.status(500).json({ ok: false, error: 'Model inference failed' });
    }
};
exports.rephraseOptions = rephraseOptions;
const aiScore = async (req, res) => {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
    }
    let client;
    try {
        client = await client_1.Client.connect(HF_SCORE_MODEL);
    }
    catch (err) {
        console.error('Failed to connect to Gradio client (AI score)', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        console.log('[ai-score] received input from frontend:', text.length > 200 ? text.slice(0, 200) + '…' : text);
        const result = await client.predict('/robust_ai_score', { text });
        const data = result?.data ?? result;
        console.log('[ai-score] model output:', JSON.stringify(data));
        return res.json({ ok: true, data });
    }
    catch (err) {
        console.error('Prediction error (AI score)', err);
        return res.status(500).json({ ok: false, error: 'Model inference failed' });
    }
};
exports.aiScore = aiScore;
const plagiarismCheck = async (req, res) => {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
    }
    let client;
    try {
        client = await client_1.Client.connect(HF_PLAGIARISM_MODEL);
    }
    catch (err) {
        console.error('Failed to connect to Gradio client (plagiarism)', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        console.log('[plagiarism] received input from frontend:', text.length > 200 ? text.slice(0, 200) + '…' : text);
        const result = await client.predict('/check_plagiarism_sync', { text });
        const data = result?.data ?? result;
        console.log('[plagiarism] model output:', JSON.stringify(data));
        return res.json({ ok: true, data });
    }
    catch (err) {
        console.error('Prediction error (plagiarism)', err);
        return res.status(500).json({ ok: false, error: 'Model inference failed' });
    }
};
exports.plagiarismCheck = plagiarismCheck;
exports.default = { rephrase: exports.rephrase, rephraseOptions: exports.rephraseOptions, aiScore: exports.aiScore, plagiarismCheck: exports.plagiarismCheck };
