"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
const stripePromise = loadStripe(pk);

export default function CheckoutClient({
  clientSecret,
  publicId,
}: {
  clientSecret: string;
  publicId: string;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm publicId={publicId} />
      </Elements>
    </div>
  );
}
