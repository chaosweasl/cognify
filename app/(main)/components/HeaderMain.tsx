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
import { cn } from "@/lib/utils";

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
    <header className="surface-overlay glass-surface border-b border-subtle sticky top-0 z-50 px-6 h-20 flex items-center">
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
            <nav className="flex flex-col space-y-2 mt-8">
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
              size="sm"
              className="h-12 px-3 gap-3 rounded-xl surface-secondary border border-subtle hover:surface-elevated hover:border-brand interactive-hover transition-all transition-normal group"
            >
              <Avatar className="h-8 w-8 border-2 border-brand-primary/40 group-hover:border-brand-primary/60 transition-colors transition-normal">
                <AvatarImage
                  src={userProfile?.avatar_url || "/assets/nopfp.png"}
                  alt="Avatar"
                />
                <AvatarFallback className="bg-gradient-brand text-white">
                  {userProfile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-primary group-hover:brand-primary transition-colors transition-normal">
                  {userProfile?.display_name?.split(" ")[0] || "User"}
                </span>
                <span className="text-xs text-muted">
                  {userProfile?.email?.split("@")[0] || "user"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-72 surface-overlay glass-surface border-subtle shadow-brand-lg"
            sideOffset={8}
          >
            {/* User profile header */}
            <div className="p-4 border-b border-subtle">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-brand-primary/30">
                  <AvatarImage
                    src={userProfile?.avatar_url || "/assets/nopfp.png"}
                    alt="Avatar"
                  />
                  <AvatarFallback className="bg-gradient-brand text-white font-semibold">
                    {userProfile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-primary truncate">
                    {userProfile?.display_name || "User"}
                  </div>
                  <div className="text-xs text-muted truncate">
                    {userProfile?.email || "user@example.com"}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-secondary hover:text-primary hover:surface-elevated interactive-hover transition-all transition-normal group"
                >
                  <div className="w-8 h-8 rounded-lg surface-secondary flex items-center justify-center group-hover:bg-gradient-brand group-hover:text-white transition-all transition-normal">
                    <Home className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Dashboard</div>
                    <div className="text-xs text-muted">Overview and stats</div>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg text-secondary hover:text-primary hover:surface-elevated interactive-hover transition-all transition-normal group"
                >
                  <div className="w-8 h-8 rounded-lg surface-secondary flex items-center justify-center group-hover:bg-gradient-brand group-hover:text-white transition-all transition-normal">
                    <Settings className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">Settings</div>
                    <div className="text-xs text-muted">
                      Preferences and account
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            </div>

            {/* Sign out with subtle separator */}
            <div className="mt-2 pt-2 border-t border-subtle">
              <DropdownMenuItem className="p-0" asChild>
                <form action={signOut} className="w-full">
                  <button
                    type="submit"
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg text-secondary hover:text-red-400 hover:bg-red-500/10 interactive-hover transition-all transition-normal group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg surface-secondary flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-400 transition-all transition-normal">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">Sign Out</div>
                      <div className="text-xs text-muted">End your session</div>
                    </div>
                  </button>
                </form>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
