"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm({ publicId }: { publicId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) return;

    setLoading(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/m/${publicId}/success`,
      },
    });

    // If redirect is required, Stripe will handle it and we won't reach here.
    if (result.error) setError(result.error.message ?? "Payment failed");
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{ padding: 12, borderRadius: 10, border: "1px solid #222", fontWeight: 800 }}
      >
        {loading ? "Processing..." : "Pay & Deliver"}
      </button>
      {error ? <div style={{ color: "tomato" }}>{error}</div> : null}
    </form>
  );
}
