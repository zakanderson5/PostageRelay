import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY in .env");

export const stripe = new Stripe(secretKey, {
  // Leaving apiVersion unspecified is okay for dev; Stripe sets one automatically.
  // If you want, we can pin an apiVersion later.
});
