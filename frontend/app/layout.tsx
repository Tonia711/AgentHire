import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JobStateProvider } from "./job-state";
import { KiwiStateProvider } from "./kiwi-state";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
