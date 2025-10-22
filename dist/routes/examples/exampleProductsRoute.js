"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const dodopayments_1 = require("@/lib/dodopayments");
const server_1 = require("next/server");
async function GET() {
    try {
        const products = await dodopayments_1.dodopayments.products.list();
        return server_1.NextResponse.json(products.items);
    }
    catch (error) {
        console.error(error);
        return server_1.NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
