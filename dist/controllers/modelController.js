"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rephrase = void 0;
const client_1 = require("@gradio/client");
// Contract:
// - Input: JSON body { text: string }
// - Output: JSON { ok: boolean, data?: any, error?: string }
const HF_MODEL = process.env.HF_GRADIO_MODEL || 'DTabs/rephrase';
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
exports.default = { rephrase: exports.rephrase };
