"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const standardwebhooks_1 = require("standardwebhooks");
const headers_1 = require("next/headers");
const dodopayments_1 = require("@/lib/dodopayments");
const webhook = new standardwebhooks_1.Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY);
async function POST(request) {
    const headersList = await (0, headers_1.headers)();
    try {
        const rawBody = await request.text();
        const webhookHeaders = {
            "webhook-id": headersList.get("webhook-id") || "",
            "webhook-signature": headersList.get("webhook-signature") || "",
            "webhook-timestamp": headersList.get("webhook-timestamp") || "",
        };
        await webhook.verify(rawBody, webhookHeaders);
        const payload = JSON.parse(rawBody);
        if (payload.data.payload_type === "Subscription") {
            switch (payload.type) {
                case "subscription.active":
                    const subscription = await dodopayments_1.dodopayments.subscriptions.retrieve(payload.data.subscription_id);
                    console.log("-------SUBSCRIPTION DATA START ---------");
                    console.log(subscription);
                    console.log("-------SUBSCRIPTION DATA END ---------");
                    break;
                case "subscription.failed":
                    break;
                case "subscription.cancelled":
                    break;
                case "subscription.renewed":
                    break;
                case "subscription.on_hold":
                    break;
                default:
                    break;
            }
        }
        else if (payload.data.payload_type === "Payment") {
            switch (payload.type) {
                case "payment.succeeded":
                    const paymentDataResp = await dodopayments_1.dodopayments.payments.retrieve(payload.data.payment_id);
                    console.log("-------PAYMENT DATA START ---------");
                    console.log(paymentDataResp);
                    console.log("-------PAYMENT DATA END ---------");
                    break;
                default:
                    break;
            }
        }
        return Response.json({ message: "Webhook processed successfully" }, { status: 200 });
    }
    catch (error) {
        console.log(" ----- webhoook verification failed -----");
        console.log(error);
        return Response.json({ message: "Webhook processed successfully" }, { status: 200 });
    }
}
