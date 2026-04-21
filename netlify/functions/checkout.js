import Stripe from "stripe";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "STRIPE_SECRET_KEY is not configured on the server." }) };
    }

    const stripe = new Stripe(stripeSecretKey);
    // You should pass the referring origin up from the client or define APP_URL
    const origin = process.env.APP_URL || event.headers.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Unlimited AI Prompt Generator Lifetime Access",
              description: "One-time payment for unlimited AI prompt generation.",
            },
            unit_amount: 30000, // $300.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (error) {
    console.error("Stripe Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to create checkout session" }),
    };
  }
};
