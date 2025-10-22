"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProductCard;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function ProductCard({ product }) {
    const [loading, setLoading] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    const checkoutProduct = async (productId, is_recurring, useDynamicPaymentLinks) => {
        if (useDynamicPaymentLinks) {
            setLoading(true);
            let productType = "onetime";
            if (is_recurring) {
                productType = "subscription";
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout/${productType}?productId=${productId}`, {
                cache: "no-store",
            });
            const data = await response.json();
            router.push(data.payment_link);
        }
        else {
            let checkoutUrl = `https://test.checkout.dodopayments.com/buy/${productId}?quantity=1&redirect_url=${process.env.NEXT_PUBLIC_BASE_URL}`;
            router.push(checkoutUrl);
        }
    };
    return (<div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:transform hover:scale-105 hover:shadow-xl transition-all duration-300">
      <h2 className="text-xl font-bold text-black">{product.name}</h2>
      <p className="text-gray-700 mt-2">{product.description}</p>
      <p className="text-green-600 font-semibold mt-4">${product.price / 100}</p>
      <button className="text-xl font-bold text-black" onClick={() => checkoutProduct(product.product_id, product.is_recurring, false)} disabled={loading}>
        {loading ? "Processing..." : "Buy now"}
      </button>
    </div>);
}
