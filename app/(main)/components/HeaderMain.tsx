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
import { useEffect } from "react";
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
  const { theme, toggleTheme, isHydrated, hydrate } = useThemeStore();
  const { userProfile } = useUserProfile();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const navItems = [
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/docs", label: "Docs", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="surface-overlay glass-surface border-b border-subtle sticky top-0 z-50 px-4 h-20 flex items-center">
      {/* Mobile menu button */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-secondary hover:text-primary interactive-hover transition-normal"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 surface-overlay glass-surface border-subtle"
          >
            <nav className="flex flex-col space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-secondary hover:text-primary interactive-hover transition-all transition-normal"
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
          className="flex items-center gap-2 font-bold text-xl text-primary group"
        >
          <Image
            src="/favicon.png"
            alt="Cognify Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg hover:scale-110 transition-transform transition-normal"
            priority
          />
          <span className="group-hover:brand-primary transition-colors transition-normal">
            Cognify
          </span>
        </Link>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center space-x-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-secondary hover:text-primary interactive-hover transition-all transition-normal group"
            >
              <Icon className="h-4 w-4 group-hover:brand-primary transition-colors transition-normal" />
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
          className="text-secondary hover:text-primary interactive-hover transition-normal group"
        >
          {isHydrated && theme === "dark" ? (
            <Sun className="h-5 w-5 group-hover:brand-primary transition-colors transition-normal" />
          ) : (
            <Moon className="h-5 w-5 group-hover:brand-primary transition-colors transition-normal" />
          )}
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border-2 border-brand-primary/40 hover:border-brand-primary/60 hover:scale-105 transition-all transition-normal shadow-brand"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userProfile?.avatar_url || "/assets/nopfp.png"}
                  alt="Avatar"
                />
                <AvatarFallback className="bg-gradient-brand text-white">
                  {userProfile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 surface-overlay glass-surface border-subtle"
          >
            <div className="px-3 py-2 text-sm font-medium border-b border-subtle text-primary">
              {userProfile?.display_name || "User"}
            </div>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-secondary hover:text-primary interactive-hover interactive-focus group"
              >
                <Home className="h-4 w-4 group-hover:brand-primary transition-colors transition-normal" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-secondary hover:text-primary interactive-hover interactive-focus group"
              >
                <Settings className="h-4 w-4 group-hover:brand-primary transition-colors transition-normal" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full text-left text-secondary hover:text-primary interactive-hover px-2 py-1.5 text-sm rounded-sm transition-colors transition-normal group"
                >
                  <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors transition-normal" />
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
