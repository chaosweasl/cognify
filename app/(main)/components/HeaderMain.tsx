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
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { signOut } from "../dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function HeaderMain() {
  const { theme, toggleTheme } = useThemeStore();
  const { userProfile } = useUserProfile();
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
    <header className="bg-slate-800/70 backdrop-blur-xl border-b border-slate-600/50 sticky top-0 z-50 px-4 h-16 flex items-center">
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-700/50"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 bg-slate-800/95 backdrop-blur-xl border-slate-600/50"
          >
            <nav className="flex flex-col space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-slate-200 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Logo */}
      <div className="flex-1 md:flex-none">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-xl text-white"
        >
          <Image
            src="/favicon.png"
            alt="Cognify Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg hover:scale-110 transition-transform duration-200"
            priority
          />
          Cognify
        </Link>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center space-x-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-slate-200 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-slate-200 hover:text-white hover:bg-slate-700/50"
        >
          {mounted && theme === "darkgreen" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border-2 border-blue-400/40 hover:border-blue-400/60 hover:scale-105 transition-all duration-200"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userProfile?.avatar_url || "/assets/nopfp.png"}
                  alt="Avatar"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-500 text-white">
                  {userProfile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-slate-800/95 backdrop-blur-xl border-slate-600/50"
          >
            <div className="px-3 py-2 text-sm font-medium border-b border-slate-600/50 text-white">
              {userProfile?.display_name || "User"}
            </div>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-700/50"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-slate-200 hover:text-white hover:bg-slate-700/50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-600/50" />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full text-left text-slate-200 hover:text-white hover:bg-slate-700/50 px-2 py-1.5 text-sm rounded-sm transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
