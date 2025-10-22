import DodoPayments from 'dodopayments';

// Flexible environment selection:
// - DODO_ENV=test|live overrides mode.
// - Else if DODO_API_KEY_LIVE exists, use live_mode; otherwise use test_mode.
// This decouples Dodo mode from NODE_ENV so you can test in production deploys.
const liveKey = process.env.DODO_API_KEY_LIVE;
const testKey = process.env.DODO_API_KEY_TEST;
const dodoEnv = (process.env.DODO_ENV || '').toLowerCase();

let mode: 'live_mode' | 'test_mode';
let token: string | undefined;

if (dodoEnv === 'live') {
  mode = 'live_mode';
  token = liveKey;
} else if (dodoEnv === 'test') {
  mode = 'test_mode';
  token = testKey;
} else if (liveKey) {
  mode = 'live_mode';
  token = liveKey;
} else {
  mode = 'test_mode';
  token = testKey;
}

export const dodoMeta = {
  mode,
  using: mode === 'live_mode' ? 'live' : 'test',
  hasLiveKey: Boolean(liveKey),
  hasTestKey: Boolean(testKey),
};

export const dodopayments = new DodoPayments({
  bearerToken: token,
  environment: mode,
});

export default dodopayments;
