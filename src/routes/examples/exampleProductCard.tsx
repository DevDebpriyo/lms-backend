"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  product_id: number;
  name: string;
  description: string;
  price: number;
  is_recurring: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkoutProduct = async (productId: number, is_recurring: boolean, useDynamicPaymentLinks: boolean) => {
    if (useDynamicPaymentLinks) {
      setLoading(true);
      let productType = "onetime"
      if (is_recurring) {
        productType = "subscription"
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout/${productType}?productId=${productId}`, {
        cache: "no-store",
      });
      const data = await response.json();
      router.push(data.payment_link)
    } else {
      let checkoutUrl = `https://test.checkout.dodopayments.com/buy/${productId}?quantity=1&redirect_url=${process.env.NEXT_PUBLIC_BASE_URL}`
      router.push(checkoutUrl)
    }

  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:transform hover:scale-105 hover:shadow-xl transition-all duration-300">
      <h2 className="text-xl font-bold text-black">{product.name}</h2>
      <p className="text-gray-700 mt-2">{product.description}</p>
      <p className="text-green-600 font-semibold mt-4">${product.price / 100}</p>
      <button
        className="text-xl font-bold text-black"
        onClick={() => checkoutProduct(product.product_id, product.is_recurring, false)}
        disabled={loading}
      >
        {loading ? "Processing..." : "Buy now"}
      </button>
    </div>
  );
}
