import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "SentinelGraph | Autonomous Multi-Agent Security SOC",
  description: "Graph-Native Cybersecurity SOC platform powered by FalkorDB, MCP, and autonomous AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#080d1a] text-slate-100 min-h-screen flex flex-col antialiased">
        <Header />

        <main className="flex-1 w-full py-4 sm:py-6 lg:py-8">
          {children}
        </main>

        <footer className="border-t border-slate-800/60 bg-[#090e1c] py-4 text-center text-xs text-slate-500">
          <p>SentinelGraph Security Operations Center • Autonomous Graph-Native SOC • FalkorDB + MCP Swarm</p>
        </footer>
      </body>
    </html>
  );
}
