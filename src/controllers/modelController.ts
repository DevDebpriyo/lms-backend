import { Request, Response } from 'express';
import { Client } from '@gradio/client';

// Contract:
// - Input: JSON body { text: string }
// - Output: JSON { ok: boolean, data?: any, error?: string }

const HF_MODEL = process.env.HF_GRADIO_MODEL || 'DTabs/rephrase';

export const rephrase = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ ok: false, error: 'Invalid or missing `text` in request body' });
  }

  let client: any;
  try {
    client = await Client.connect(HF_MODEL);
  } catch (err: any) {
    console.error('Failed to connect to Gradio client', err);
    return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
  }

  try {
    const result = await client.predict('/predict', { text });
    // The Gradio result typically contains `data` array. Return it as-is for now.
    return res.json({ ok: true, data: result?.data ?? result });
  } catch (err: any) {
    console.error('Prediction error', err);
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
    console.error('Failed to connect to Gradio client', err);
    return res.status(502).json({ ok: false, error: 'Failed to connect to model host' });
  }

  try {
    // This endpoint differs by using the '/predict_1' path for options output
    const result = await client.predict('/predict_1', { text });
    return res.json({ ok: true, data: result?.data ?? result });
  } catch (err: any) {
    console.error('Prediction error (options)', err);
    return res.status(500).json({ ok: false, error: 'Model inference failed' });
  }
};

export default { rephrase, rephraseOptions };
