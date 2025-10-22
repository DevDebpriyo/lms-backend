import DodoPayments from 'dodopayments';

const isProd = process.env.NODE_ENV === 'production';

export const dodopayments = new DodoPayments({
  bearerToken: isProd ? process.env.DODO_API_KEY_LIVE : process.env.DODO_API_KEY_TEST,
  environment: isProd ? 'live_mode' : 'test_mode',
});

export default dodopayments;
