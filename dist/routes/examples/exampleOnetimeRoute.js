"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const dodopayments_1 = require("@/lib/dodopayments");
const server_1 = require("next/server");
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const productWithQuantity = { product_id: productId, quantity: 1 };
        const response = await dodopayments_1.dodopayments.payments.create({
            // GET BILLING, CUSTOMER INFO FROM CUSTOMER AND PASS IT.
            // FOR COUNTRY CODE THE VALUE SHOULD BE - ISO country code alpha2 variant
            billing: {
                city: "",
                country: "",
                state: "",
                street: "",
                zipcode: "",
            },
            customer: {
                email: "",
                name: "",
            },
            payment_link: true,
            product_cart: [productWithQuantity],
            return_url: process.env.NEXT_PUBLIC_BASE_URL,
        });
        return server_1.NextResponse.json(response);
    }
    catch (error) {
        console.error(error);
        return server_1.NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
