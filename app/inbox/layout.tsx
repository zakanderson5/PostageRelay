import { ReactNode } from "react";
import { notFound } from "next/navigation";

export default function InboxLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <>{children}</>;
}
