
import { dodopayments } from "@/lib/dodopayments";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productWithQuantity = {product_id: productId as string, quantity: 1}

    const response = await dodopayments.payments.create({
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
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
