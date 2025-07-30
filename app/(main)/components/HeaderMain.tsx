"use client";

import {
  Menu,
  LogOut,
  Sun,
  Moon,
  FolderOpen,
  Home,
  BookOpen,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useThemeStore } from "@/hooks/useTheme";
import React from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { useUserProfileStore } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { signOut } from "../dashboard/actions";

export function HeaderMain() {
  const { theme, toggleTheme } = useThemeStore();
  const { userProfile } = useUserProfileStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/docs", label: "Docs", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="navbar bg-base-100 border-b border-base-200 px-4 min-h-16 sticky top-0 z-40">
      {/* Mobile menu button */}
      <div className="navbar-start md:hidden">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <Menu className="w-5 h-5" />
          </div>
          <ul className="menu menu-sm dropdown-content mt-3 z-50 p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
            {navItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Logo */}
      <div className="navbar-start hidden md:flex">
        <Link href="/dashboard" className="btn btn-ghost text-xl font-bold">
          <Image
            src="/favicon.svg"
            alt="Cognify"
            width={24}
            height={24}
            className="w-6 h-6"
            priority
          />
          Cognify
        </Link>
      </div>

      {/* Center logo for mobile */}
      <div className="navbar-center md:hidden">
        <Link href="/dashboard" className="btn btn-ghost text-xl font-bold">
          <Image
            src="/favicon.svg"
            alt="Cognify"
            width={24}
            height={24}
            className="w-6 h-6"
            priority
          />
          Cognify
        </Link>
      </div>

      {/* Desktop navigation */}
      <div className="navbar-center hidden md:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Right side actions */}
      <div className="navbar-end gap-3">
        <NotificationBell />
        {/* Theme toggle with better styling */}
        <button
          className="btn btn-ghost btn-circle hover:bg-base-200 transition-colors"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mounted && theme === "dim" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Enhanced User dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar border-2 border-primary hover:scale-105 transition-transform"
          >
            <div className="w-10 rounded-full overflow-hidden bg-base-200">
              <Image
                src={userProfile?.avatar_url || "/assets/nopfp.png"}
                alt="Avatar"
                width={40}
                height={40}
                className="object-cover w-full h-full"
                priority
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/nopfp.png";
                }}
              />
            </div>
          </div>
          <ul className="menu menu-sm dropdown-content mt-3 z-50 p-3 shadow-lg bg-base-100 rounded-box w-64 border border-base-200">
            <li className="font-bold text-base-content/80 px-2 py-1 mb-1 border-b border-base-200 text-lg">
              {userProfile?.display_name || "User"}
            </li>
            <li>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-primary hover:text-primary-content transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-primary hover:text-primary-content transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </li>
            <li>
              <form
                action={signOut}
                className="w-full m-0 p-0 flex items-center gap-2 px-2 py-2 rounded-md transition-colors hover:bg-error hover:text-error-content cursor-pointer"
              >
                <button
                  type="submit"
                  className="w-full h-full flex items-center gap-2 bg-transparent border-0 shadow-none p-0 m-0 text-left justify-start cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
