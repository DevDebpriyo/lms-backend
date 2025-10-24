import { Request, Response } from 'express';
import { Client } from '@gradio/client';
import { inspect } from 'util';

// Contract:
// - Input: JSON body { text: string }
// - Output: JSON { ok: boolean, data?: any, error?: string }

const HF_MODEL = process.env.HF_GRADIO_MODEL || 'DTabs/rephrase';
const HF_SCORE_MODEL = process.env.HF_GRADIO_SCORE_MODEL || 'DTabs/AI_score';
const HF_PLAGIARISM_MODEL = process.env.HF_GRADIO_PLAGIARISM_MODEL || 'DTabs/AI_score';
const HF_TONE_MODEL = process.env.HF_GRADIO_TONE_MODEL || 'DTabs/Tone_modify';

// Simple structured logger helpers for readable terminal output
const formatObj = (o: any) => inspect(o, { depth: null, colors: false });
const prefix = (tag: string) => `${new Date().toISOString()} [${tag}]`;
const logInfo = (tag: string, msg: string, obj?: any) => {
  if (obj !== undefined) console.log(`${prefix(tag)} ${msg}\n${formatObj(obj)}`);
  else console.log(`${prefix(tag)} ${msg}`);
};
const logError = (tag: string, msg: string, err?: any) => {
  if (err !== undefined) console.error(`${prefix(tag)} ${msg}\n${formatObj(err)}`);
  else console.error(`${prefix(tag)} ${msg}`);
};
const preview = (text: string, max = 200) => (text.length > max ? text.slice(0, max) + '…' : text);

export const rephrase = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
  }

  let client: any;
  try {
    client = await Client.connect(HF_MODEL);
  } catch (err: any) {
    logError('REPHRASE', 'Failed to connect to Gradio client', err);
    return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
  }

  try {
    const result = await client.predict('/predict', { text });
    // The Gradio result typically contains `data` array. Return it as-is for now.
    return res.json({ ok: true, data: result?.data ?? result });
  } catch (err: any) {
    logError('REPHRASE', 'Prediction error', err);
    return res.status(500).json({ ok: false, error: 'Model inference failed' });
  }
};

export const rephraseOptions = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
  }

  let client: any;
  try {
    client = await Client.connect(HF_MODEL);
  } catch (err: any) {
    logError('REPHRASE-OPT', 'Failed to connect to Gradio client', err);
    return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
  }

  try {
    // This endpoint differs by using the '/predict_1' path for options output
    const result = await client.predict('/predict_1', { text });
    return res.json({ ok: true, data: result?.data ?? result });
  } catch (err: any) {
    logError('REPHRASE-OPT', 'Prediction error (options)', err);
    return res.status(500).json({ ok: false, error: 'Model inference failed' });
  }
};

export const aiScore = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
  }

  let client: any;
  try {
    client = await Client.connect(HF_SCORE_MODEL);
  } catch (err: any) {
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
  } catch (err: any) {
    logError('🫥AI-SCORE', 'Prediction error', err);
    return res.status(500).json({ ok: false, error: 'Model inference failed' });
  }
};

export const plagiarismCheck = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
  }

  let client: any;
  try {
    client = await Client.connect(HF_PLAGIARISM_MODEL);
  } catch (err: any) {
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
  } catch (err: any) {
    logError('🫥PLAGIARISM', 'Prediction error', err);
    return res.status(500).json({ ok: false, error: 'Model inference failed' });
  }
};

export const toneRewrite = async (req: Request, res: Response) => {
  const { text, tone } = req.body as { text?: string; tone?: string };
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
  }
  if (typeof tone !== 'string' || !tone.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `tone` in request body' });
  }

  let client: any;
  try {
    client = await Client.connect(HF_TONE_MODEL);
  } catch (err: any) {
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
  } catch (err: any) {
    logError('🫥TONE', 'Prediction error', err);
    return res.status(500).json({ ok: false, error: 'Model inference failed' });
  }
};

export default { rephrase, rephraseOptions, aiScore, plagiarismCheck, toneRewrite };
