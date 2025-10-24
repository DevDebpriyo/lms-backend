"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toneRewrite = exports.plagiarismCheck = exports.aiScore = exports.rephraseOptions = exports.rephrase = void 0;
const client_1 = require("@gradio/client");
const util_1 = require("util");
// Contract:
// - Input: JSON body { text: string }
// - Output: JSON { ok: boolean, data?: any, error?: string }
const HF_MODEL = process.env.HF_GRADIO_MODEL || 'DTabs/rephrase';
const HF_SCORE_MODEL = process.env.HF_GRADIO_SCORE_MODEL || 'DTabs/AI_score';
const HF_PLAGIARISM_MODEL = process.env.HF_GRADIO_PLAGIARISM_MODEL || 'DTabs/AI_score';
const HF_TONE_MODEL = process.env.HF_GRADIO_TONE_MODEL || 'DTabs/Tone_modify';
// Simple structured logger helpers for readable terminal output
const formatObj = (o) => (0, util_1.inspect)(o, { depth: null, colors: false });
const prefix = (tag) => `${new Date().toISOString()} [${tag}]`;
const logInfo = (tag, msg, obj) => {
    if (obj !== undefined)
        console.log(`${prefix(tag)} ${msg}\n${formatObj(obj)}`);
    else
        console.log(`${prefix(tag)} ${msg}`);
};
const logError = (tag, msg, err) => {
    if (err !== undefined)
        console.error(`${prefix(tag)} ${msg}\n${formatObj(err)}`);
    else
        console.error(`${prefix(tag)} ${msg}`);
};
const preview = (text, max = 200) => (text.length > max ? text.slice(0, max) + '…' : text);
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
        logError('REPHRASE', 'Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        const result = await client.predict('/predict', { text });
        // The Gradio result typically contains `data` array. Return it as-is for now.
        return res.json({ ok: true, data: result?.data ?? result });
    }
    catch (err) {
        logError('REPHRASE', 'Prediction error', err);
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
        logError('REPHRASE-OPT', 'Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        // This endpoint differs by using the '/predict_1' path for options output
        const result = await client.predict('/predict_1', { text });
        return res.json({ ok: true, data: result?.data ?? result });
    }
    catch (err) {
        logError('REPHRASE-OPT', 'Prediction error (options)', err);
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
        logError('😒AI-SCORE', 'Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        const p = preview(text);
        logInfo('✅AI-SCORE', `Received input (len=${text.length}) preview: ${p}`);
        const result = await client.predict('/robust_ai_score', { text });
        const data = result?.data ?? result;
        logInfo('💥AI-SCORE', 'Model output', data);
        return res.json({ ok: true, data });
    }
    catch (err) {
        logError('🫥AI-SCORE', 'Prediction error', err);
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
        logError('😒PLAGIARISM', 'Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        const p = preview(text);
        logInfo('✅PLAGIARISM', `Received input (len=${text.length}) preview: ${p}`);
        const result = await client.predict('/check_plagiarism_sync', { text });
        const data = result?.data ?? result;
        logInfo('💥PLAGIARISM', 'Model output', data);
        return res.json({ ok: true, data });
    }
    catch (err) {
        logError('🫥PLAGIARISM', 'Prediction error', err);
        return res.status(500).json({ ok: false, error: 'Model inference failed' });
    }
};
exports.plagiarismCheck = plagiarismCheck;
const toneRewrite = async (req, res) => {
    const { text, tone } = req.body;
    if (typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
    }
    if (typeof tone !== 'string' || !tone.trim()) {
        return res.status(400).json({ ok: false, error: 'Invalid or missing `tone` in request body' });
    }
    let client;
    try {
        client = await client_1.Client.connect(HF_TONE_MODEL);
    }
    catch (err) {
        logError('😒TONE', 'Failed to connect to Gradio client', err);
        return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
    }
    try {
        const p = preview(text);
        logInfo('✅TONE', `Received input (len=${text.length}) tone="${tone}" preview: ${p}`);
        const result = await client.predict('/predict', { text, tone });
        const data = result?.data ?? result;
        logInfo('💥TONE', 'Model output', data);
        return res.json({ ok: true, data });
    }
    catch (err) {
        logError('🫥TONE', 'Prediction error', err);
        return res.status(500).json({ ok: false, error: 'Model inference failed' });
    }
};
exports.toneRewrite = toneRewrite;
exports.default = { rephrase: exports.rephrase, rephraseOptions: exports.rephraseOptions, aiScore: exports.aiScore, plagiarismCheck: exports.plagiarismCheck, toneRewrite: exports.toneRewrite };
