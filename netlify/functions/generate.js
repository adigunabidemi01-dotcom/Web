import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";

export const handler = async (event) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Only accept POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    const { prompt, method, sessionId } = JSON.parse(event.body);

    if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ error: "Prompt is required." }) };

    // 1. Verify Authorization
    if (method === "stripe") {
      if (!sessionId) return { statusCode: 400, headers, body: JSON.stringify({ error: "Session ID required" }) };
      
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "Stripe missing." }) };
      
      const stripe = new Stripe(stripeSecretKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== "paid") {
        return { statusCode: 402, headers, body: JSON.stringify({ error: "Payment not completed." }) };
      }
    } else if (method === "ad_credit") {
      // In a real production setup with a DB (like Cloudflare KV, Supabase, or Netlify Blobs),
      // we would verify the user's ad views token here. For this demo, we trust the client flag.
      // But we prevent abuse by applying basic rate limits on the gateway/WAF.
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid method." }) };
    }

    // 2. Call Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert prompt generator. The user gives you a topic or a brief description, and you expand it into a highly detailed, professional, and effective prompt they can use for other AI models. Output only the prompt text itself.",
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ result: response.text }),
    };

  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Failed to generate prompt" }),
    };
  }
};
