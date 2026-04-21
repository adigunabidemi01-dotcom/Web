import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Create Stripe Checkout Session
  app.post("/api/checkout", async (req, res) => {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured on the server." });
      }

      const stripe = new Stripe(stripeSecretKey);
      
      // Determine the origin URL for redirects
      const origin = process.env.APP_URL || req.headers.origin || `http://localhost:${PORT}`;

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

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Error:", error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // API Route: Generate AI Prompt
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, method, sessionId } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      // Verification Logic
      if (method === "stripe") {
        if (!sessionId) return res.status(400).json({ error: "Session ID required for Stripe verification." });
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) return res.status(500).json({ error: "Stripe not configured." });
        const stripe = new Stripe(stripeSecretKey);
        
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session.payment_status !== "paid") {
            return res.status(402).json({ error: "Payment not completed." });
          }
        } catch (e) {
          return res.status(400).json({ error: "Invalid session ID." });
        }
      } else if (method === "ad_credit") {
        // In a real app, ad views would fire server-side webhooks.
        // For this static app scope, we trust the client's assertion they used an ad credit.
      } else {
        return res.status(400).json({ error: "Invalid authorization method." });
      }

      // Generate text with Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert prompt generator. The user gives you a topic or a brief description, and you expand it into a highly detailed, professional, and effective prompt they can use for other AI models. Output only the prompt text itself, no conversational filler.",
        }
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate prompt" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
