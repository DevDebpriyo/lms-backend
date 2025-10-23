"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const standardwebhooks_1 = require("standardwebhooks");
const dodopayments_1 = __importStar(require("../services/dodopayments"));
const url_1 = require("../utils/url");
const router = express_1.default.Router();
const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
const webhook = webhookSecret ? new standardwebhooks_1.Webhook(webhookSecret) : null;
const RETURN_URL = (0, url_1.getFrontendBaseUrl)();
// GET /api/payments/products
router.get('/products', async (_req, res) => {
    try {
        const monthlyEnv = process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_MONTHLY_PRODUCT_ID;
        const yearlyEnv = process.env.DODO_PRODUCT_YEARLY_ID || process.env.DODO_YEARLY_PRODUCT_ID;
        // 1) If both env IDs are provided, return exactly two normalized products
        if (monthlyEnv && yearlyEnv) {
            return res.json([
                { id: String(monthlyEnv), name: 'Monthly', interval: 'month' },
                { id: String(yearlyEnv), name: 'Yearly', interval: 'year' },
            ]);
        }
        // 2) Else, fetch from Dodo and infer the monthly/yearly products
        const products = await dodopayments_1.default.products.list();
        const items = products?.items || [];
        const normalizeId = (p) => (p?.product_id ?? p?.id ?? p?._id)?.toString();
        const getInterval = (p) => {
            const fields = [
                p?.interval,
                p?.billing_interval,
                p?.billingInterval,
                p?.billingCycle,
                p?.recurring_interval,
                p?.period,
            ];
            const intervalRaw = String(fields.find((x) => x) || '').toLowerCase();
            if (intervalRaw.includes('month'))
                return 'month';
            if (intervalRaw.includes('year') || intervalRaw.includes('annual'))
                return 'year';
            const nameRaw = String(p?.name || p?.title || p?.planName || p?.displayName || p?.plan || p?.slug || '').toLowerCase();
            if (nameRaw.includes('month'))
                return 'month';
            if (nameRaw.includes('year') || nameRaw.includes('annual'))
                return 'year';
            return undefined;
        };
        const findBy = (want) => items.find((p) => getInterval(p) === want) ||
            items.find((p) => {
                const name = String(p?.name || p?.title || p?.planName || p?.displayName || p?.plan || p?.slug || '').toLowerCase();
                return want === 'month' ? name.includes('month') : name.includes('year') || name.includes('annual');
            });
        const monthly = monthlyEnv ? { product_id: monthlyEnv } : findBy('month');
        const yearly = yearlyEnv ? { product_id: yearlyEnv } : findBy('year');
        const monthlyId = monthlyEnv || normalizeId(monthly);
        const yearlyId = yearlyEnv || normalizeId(yearly);
        if (!monthlyId || !yearlyId) {
            console.error('[payments/products] Could not infer monthly/yearly products', {
                dodo_mode: dodopayments_1.dodoMeta.mode,
                has_live_key: dodopayments_1.dodoMeta.hasLiveKey,
                has_test_key: dodopayments_1.dodoMeta.hasTestKey,
                available: items.map((p) => ({ id: normalizeId(p), name: p?.name, title: p?.title, slug: p?.slug, interval: getInterval(p) })),
            });
            return res.status(500).json({
                error: 'Monthly/Yearly products not found',
                hint: 'Set DODO_PRODUCT_MONTHLY_ID and DODO_PRODUCT_YEARLY_ID env vars to override or ensure product names/intervals contain month/year.',
            });
        }
        return res.json([
            { id: String(monthlyId), name: 'Monthly', interval: 'month' },
            { id: String(yearlyId), name: 'Yearly', interval: 'year' },
        ]);
    }
    catch (err) {
        const e = err;
        console.error('[payments/products] Error', {
            dodo_mode: dodopayments_1.dodoMeta.mode,
            has_live_key: dodopayments_1.dodoMeta.hasLiveKey,
            has_test_key: dodopayments_1.dodoMeta.hasTestKey,
            status: e?.status,
            name: e?.name,
            message: e?.message,
        });
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// GET /api/payments/checkout/onetime?productId=123
router.get('/checkout/onetime', async (req, res) => {
    try {
        const productId = String(req.query.productId || '');
        if (!productId)
            return res.status(400).json({ error: 'Missing productId' });
        const productWithQuantity = { product_id: productId, quantity: 1 };
        const response = await dodopayments_1.default.payments.create({
            // TODO: Collect these details from your frontend and pass through.
            billing: { city: '', country: 'US', state: '', street: '', zipcode: '' },
            customer: { email: '', name: '' },
            payment_link: true,
            product_cart: [productWithQuantity],
            return_url: (0, url_1.buildReturnUrl)('/profile'),
        });
        res.json(response);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create payment link' });
    }
});
// GET /api/payments/checkout/subscription?productId=123
router.get('/checkout/subscription', async (req, res) => {
    try {
        const productId = String(req.query.productId || '');
        if (!productId)
            return res.status(400).json({ error: 'Missing productId' });
        const response = await dodopayments_1.default.subscriptions.create({
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
            return_url: (0, url_1.buildReturnUrl)('/profile'),
        });
        res.json(response);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create subscription link' });
    }
});
// POST /api/payments/webhook
router.post('/webhook', async (req, res) => {
    try {
        if (!webhook)
            throw new Error('Webhook secret is not configured');
        // req.body is a Buffer here because we attach express.raw() at this path in server.ts
        const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : '';
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
                    const subscription = await dodopayments_1.default.subscriptions.retrieve(payload.data.subscription_id);
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
        }
        else if (payload?.data?.payload_type === 'Payment') {
            switch (payload.type) {
                case 'payment.succeeded': {
                    const payment = await dodopayments_1.default.payments.retrieve(payload.data.payment_id);
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
    }
    catch (error) {
        console.log('----- webhook processing error -----');
        console.log({
            dodo_mode: dodopayments_1.dodoMeta.mode,
            has_live_key: dodopayments_1.dodoMeta.hasLiveKey,
            has_test_key: dodopayments_1.dodoMeta.hasTestKey,
            status: error?.status,
            name: error?.name,
            message: error?.message,
        });
        if (error?.status === 401) {
            console.log('Dodo API returned 401. Likely causes:');
            console.log('- Environment mismatch (using live_mode with a test key or vice versa).');
            console.log('- Missing DODO_API_KEY_LIVE/DODO_API_KEY_TEST for the selected mode.');
            console.log('- Set DODO_ENV=test on Render if you want to use your TEST key in production deploys.');
        }
        // Acknowledge to avoid retries while integrating; adjust to 400 if you want retries
        return res.status(200).json({ message: 'Webhook processed successfully' });
    }
});
exports.default = router;
// DEBUG: Surface current Dodo mode/key presence and return_url used (no secrets).
router.get('/debug', (_req, res) => {
    res.json({
        dodo_mode: dodopayments_1.dodoMeta.mode,
        using: dodopayments_1.dodoMeta.using,
        has_live_key: dodopayments_1.dodoMeta.hasLiveKey,
        has_test_key: dodopayments_1.dodoMeta.hasTestKey,
        return_url: (0, url_1.buildReturnUrl)('/profile'),
    });
});
// GET /api/payments/checkout/subscription/plan?plan=monthly|yearly[&returnPath=/profile]
// Uses environment variables to map plan -> product_id
//   DODO_MONTHLY_PRODUCT_ID, DODO_YEARLY_PRODUCT_ID
router.get('/checkout/subscription/plan', async (req, res) => {
    try {
        const plan = String(req.query.plan || '').toLowerCase();
        const returnPath = typeof req.query.returnPath === 'string' ? req.query.returnPath : '/profile';
        const monthlyId = process.env.DODO_MONTHLY_PRODUCT_ID;
        const yearlyId = process.env.DODO_YEARLY_PRODUCT_ID;
        let productId;
        if (plan === 'monthly')
            productId = monthlyId || undefined;
        if (plan === 'yearly')
            productId = yearlyId || undefined;
        if (!plan || !productId) {
            return res.status(400).json({
                error: 'Invalid plan or product mapping missing',
                details: {
                    plan,
                    has_monthly_id: Boolean(monthlyId),
                    has_yearly_id: Boolean(yearlyId),
                    expected_envs: ['DODO_MONTHLY_PRODUCT_ID', 'DODO_YEARLY_PRODUCT_ID'],
                },
            });
        }
        const response = await dodopayments_1.default.subscriptions.create({
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
            return_url: (0, url_1.buildReturnUrl)(returnPath),
        });
        return res.json(response);
    }
    catch (e) {
        console.error('[checkout/subscription/plan] Error', {
            dodo_mode: dodopayments_1.dodoMeta.mode,
            has_live_key: dodopayments_1.dodoMeta.hasLiveKey,
            has_test_key: dodopayments_1.dodoMeta.hasTestKey,
            status: e?.status,
            name: e?.name,
            message: e?.message,
        });
        return res.status(500).json({ error: 'Failed to create subscription payment link' });
    }
});
