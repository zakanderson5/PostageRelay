import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400","500","600","700","800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GatePost Inbox",
    template: "%s | GatePost Inbox",
  },
  description:
    "A pay-to-reach inbox for businesses. Require a refundable bond for inbound email. Accept to get paid, or release/ignore to refund.",
  metadataBase: new URL("https://www.gatepostinbox.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.className}>
      <body>{children}</body>
    </html>
  );
}
