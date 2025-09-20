import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./_components/ToastProvider";

export const metadata: Metadata = {
  title: "The RC Racing Engineer | Live telemetry intelligence for every stint",
  description:
    "The RC Racing Engineer synchronizes telemetry, strategy calls, and setup notes so crews can make confident decisions in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
