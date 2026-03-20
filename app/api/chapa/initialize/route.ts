import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, email, first_name, last_name, tx_ref } = body;

    if (!amount || !email || !first_name || !tx_ref) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const chapaPayload = {
      amount: amount.toString(),
      currency: "ETB",
      email: email,
      first_name: first_name,
      last_name: last_name || "",
      tx_ref: tx_ref,
      callback_url: `${appUrl}/api/verify-payment?tx_ref=${tx_ref}`,
      return_url: `${appUrl}/api/verify-payment?tx_ref=${tx_ref}`,
      customization: {
        title: "Omnia Booking",
        description: "Payment for booking",
      }
    };

    const response = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chapaPayload)
    });

    const data = await response.json();

    if (data.status === "success") {
      return NextResponse.json({
        message: "Payment initialized",
        checkoutUrl: data.data.checkout_url
      });
    } else {
      console.error("Chapa initialization error:", data);
      return NextResponse.json(
        { message: data.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error initializing Chapa:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
