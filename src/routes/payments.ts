import express, { Request, Response } from 'express';
import { Webhook } from 'standardwebhooks';
import dodopayments from '../services/dodopayments';
import { getFrontendBaseUrl } from '../utils/url';

const router = express.Router();

const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
const webhook = webhookSecret ? new Webhook(webhookSecret) : null;

const RETURN_URL = getFrontendBaseUrl();

// GET /api/payments/products
router.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await dodopayments.products.list();
    res.json(products.items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/payments/checkout/onetime?productId=123
router.get('/checkout/onetime', async (req: Request, res: Response) => {
  try {
    const productId = String(req.query.productId || '');
    if (!productId) return res.status(400).json({ error: 'Missing productId' });

    const productWithQuantity = { product_id: productId, quantity: 1 } as const;

    const response = await dodopayments.payments.create({
      // TODO: Collect these details from your frontend and pass through.
      billing: { city: '', country: 'US', state: '', street: '', zipcode: '' },
      customer: { email: '', name: '' },
      payment_link: true,
      product_cart: [productWithQuantity],
      return_url: RETURN_URL,
    });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// GET /api/payments/checkout/subscription?productId=123
router.get('/checkout/subscription', async (req: Request, res: Response) => {
  try {
    const productId = String(req.query.productId || '');
    if (!productId) return res.status(400).json({ error: 'Missing productId' });

    const response = await dodopayments.subscriptions.create({
      billing: {
        city: 'Sydney',
        country: 'AU',
        state: 'New South Wales',
        street: '1, Random address',
        zipcode: '2000',
      },
      customer: { email: 'test@example.com', name: 'Customer Name' },
      payment_link: true,
      product_id: productId,
      quantity: 1,
      return_url: RETURN_URL,
    });
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription link' });
  }
});

// POST /api/payments/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!webhook) throw new Error('Webhook secret is not configured');

    // req.body is a Buffer here because we attach express.raw() at this path in server.ts
    const rawBody = (req as any).body instanceof Buffer ? (req as any).body.toString('utf8') : '';

    const webhookHeaders = {
      'webhook-id': req.header('webhook-id') || '',
      'webhook-signature': req.header('webhook-signature') || '',
      'webhook-timestamp': req.header('webhook-timestamp') || '',
    };

    await webhook.verify(rawBody, webhookHeaders);
    const payload = JSON.parse(rawBody);

    if (payload?.data?.payload_type === 'Subscription') {
      switch (payload.type) {
        case 'subscription.active': {
          const subscription = await dodopayments.subscriptions.retrieve(payload.data.subscription_id);
          console.log('-------SUBSCRIPTION DATA START ---------');
          console.log(subscription);
          console.log('-------SUBSCRIPTION DATA END ---------');
          break;
        }
        case 'subscription.failed':
        case 'subscription.cancelled':
        case 'subscription.renewed':
        case 'subscription.on_hold':
        default:
          break;
      }
    } else if (payload?.data?.payload_type === 'Payment') {
      switch (payload.type) {
        case 'payment.succeeded': {
          const payment = await dodopayments.payments.retrieve(payload.data.payment_id);
          console.log('-------PAYMENT DATA START ---------');
          console.log(payment);
          console.log('-------PAYMENT DATA END ---------');
          // TODO: mark order/user entitlement in DB
          break;
        }
        default:
          break;
      }
    }

    return res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.log('----- webhook verification failed -----');
    console.log(error);
    // Acknowledge to avoid retries while integrating; adjust to 400 if you want retries
    return res.status(200).json({ message: 'Webhook processed successfully' });
  }
});

export default router;
