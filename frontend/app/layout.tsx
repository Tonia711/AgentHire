import type { Metadata } from "next";
import { JobStateProvider } from "./job-state";
import { KiwiStateProvider } from "./kiwi-state";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "KiwiContract",
  description: "AI-powered contractor management for Aotearoa on Avalanche Fuji.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <JobStateProvider>
            <KiwiStateProvider>{children}</KiwiStateProvider>
          </JobStateProvider>
        </Providers>
      </body>
    </html>
  );
}
