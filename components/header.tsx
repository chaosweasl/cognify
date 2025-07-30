"use client";

import { Menu, Sun, Moon } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import Image from "next/image";
import Link from "next/link";
import { useThemeStore } from "@/hooks/useTheme";
import { useEffect, useState } from "react";

export function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="navbar bg-base-100 shadow-sm sticky top-0 z-50 border-b border-base-200">
      {/* Mobile view */}
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <Menu className="h-6 w-6" />
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link href="#features">Features</Link>
            </li>
            <li>
              <Link href="https://github.com/chaosweasl/cognify#readme">
                How it Works
              </Link>
            </li>
            <li>
              <Link href="https://github.com/chaosweasl/cognify">GitHub</Link>
            </li>
            <li className="mt-2">
              <Link href="/login" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-bold">
          <Image
            src="/favicon.svg"
            alt="Cognify Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          Cognify
        </Link>
      </div>

      {/* Desktop view */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="#features">Features</Link>
          </li>
          <li>
            <Link href="https://github.com/chaosweasl/cognify#readme">
              How it Works
            </Link>
          </li>
          <li>
            <Link href="https://github.com/chaosweasl/cognify">GitHub</Link>
          </li>
        </ul>
      </div>

      <div className="navbar-end flex items-center gap-2">
        <NotificationBell />
        <button
          className="btn btn-ghost btn-circle hover:bg-base-200 transition-colors"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "darkgreen" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )
          ) : null}
        </button>
        <Link href="/login" className="btn btn-primary">
          Get Started
        </Link>
      </div>
    </header>
  );
}
