import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ServiceWorkerRegister } from "@/components/service-worker-register";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Classic Spanish",
  title: "Classic Spanish",
  description: "Classic SRS Speaking MVP in APplus Classic-inspired UI."
};

export const viewport: Viewport = {
  themeColor: "#f4f7fb"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pl">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
