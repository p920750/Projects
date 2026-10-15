"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield, Activity, Network } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Overview", href: "/", icon: Activity },
    { name: "SOC Dashboard", href: "/dashboard", icon: Shield },
    { name: "Graph Analytics", href: "/analytics", icon: Network },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0c1222]/90 backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
              <span className="font-bold text-white tracking-wider text-base">SG</span>
            </div>
            <div className="truncate">
              <span className="font-extrabold text-base sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                SentinelGraph
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-blue-500/10 text-cyan-400 rounded-full border border-blue-500/20">
                SOC v0.1
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/20 text-cyan-300 border border-blue-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle mobile navigation menu"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            {isOpen ? <X className="h-5 w-5 text-cyan-400" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#090e1c] px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[11px] font-mono uppercase text-slate-500 px-3 pb-1 tracking-wider">
            Navigation Menu
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/20 text-cyan-300 border border-blue-500/30 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{link.name}</span>
                {isActive && (
                  <span className="ml-auto text-[10px] font-mono text-cyan-400 uppercase">Active</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
