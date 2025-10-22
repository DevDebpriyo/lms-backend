"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const dodopayments_1 = require("@/lib/dodopayments");
const server_1 = require("next/server");
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const response = await dodopayments_1.dodopayments.subscriptions.create({
            billing: {
                city: "Sydney",
                country: "AU",
                state: "New South Wales",
                street: "1, Random address",
                zipcode: "2000",
            },
            customer: {
                email: "test@example.com",
                name: `Customer Name`,
            },
            payment_link: true,
            product_id: productId,
            quantity: 1,
            return_url: process.env.NEXT_PUBLIC_BASE_URL,
        });
        return server_1.NextResponse.json(response);
    }
    catch (error) {
        console.error(error);
        return server_1.NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
