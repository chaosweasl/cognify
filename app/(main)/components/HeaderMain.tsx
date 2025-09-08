"use client";

import {
  Menu,
  LogOut,
  Sun,
  Moon,
  FolderOpen,
  Home,
  Settings,
  Brain,
} from "lucide-react"; // Removed unused imports
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { usePathname } from "next/navigation";

export function HeaderMain() {
  const { theme, toggleTheme, isHydrated, hydrate } = useThemeStore();
  const { userProfile } = useUserProfile();
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Helper function to check if nav item is active
  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      role="banner"
      className="surface-overlay glass-surface border-b border-subtle sticky top-0 z-50 px-4 sm:px-6 h-16 sm:h-20 flex items-center transition-all duration-300"
      aria-label="Site header with navigation and user menu"
    >
      {/* Mobile menu button with enhanced touch target */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-secondary hover:text-primary interactive-hover transition-all transition-normal rounded-xl touch-manipulation"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 surface-overlay glass-surface border-subtle p-0"
            aria-label="Main navigation menu"
          >
            {/* Enhanced mobile nav header */}
            <div className="p-6 border-b border-subtle">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-primary">Cognify</span>
              </div>
            </div>

            {/* Enhanced mobile navigation */}
            <nav
              className="flex flex-col p-4 space-y-1"
              role="navigation"
              aria-label="Main navigation"
            >
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = isActiveRoute(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-4 px-4 py-3 text-base rounded-xl transition-all transition-normal group touch-manipulation ${
                      isActive
                        ? "bg-gradient-brand text-white"
                        : "text-secondary hover:text-primary interactive-hover"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all transition-normal ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "surface-secondary group-hover:bg-gradient-brand group-hover:text-white"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Enhanced logo with better mobile spacing */}
      <div className="flex-1 md:flex-none ml-2 md:ml-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 sm:gap-3 font-bold text-lg sm:text-xl text-primary group"
        >
          <Image
            src="/favicon.png"
            alt="Cognify Logo"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:scale-110 transition-transform transition-normal"
            priority
          />
          <span className="group-hover:brand-primary transition-colors transition-normal">
            Cognify
          </span>
        </Link>
      </div>

      {/* Enhanced desktop navigation with better hover effects */}
      <nav className="hidden md:flex flex-1 justify-center">
        <div className="flex items-center space-x-1 bg-surface-elevated/50 backdrop-blur-sm rounded-2xl p-1 border border-subtle">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = isActiveRoute(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl transition-all transition-normal group relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-brand text-white shadow-brand"
                    : "text-secondary hover:text-primary interactive-hover"
                }`}
              >
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-10 transition-opacity transition-normal rounded-xl"></div>
                )}
                <Icon
                  className={`h-4 w-4 relative z-10 transition-colors transition-normal ${
                    isActive ? "text-white" : "group-hover:brand-primary"
                  }`}
                />
                <span className="font-medium relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Enhanced right side actions with better spacing */}
      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />

        {/* Enhanced theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="h-10 w-10 sm:h-12 sm:w-12 text-secondary hover:text-primary interactive-hover transition-all transition-normal group rounded-xl touch-manipulation"
        >
          {isHydrated && theme === "dark" ? (
            <Sun className="h-5 w-5 group-hover:brand-primary transition-colors transition-normal group-hover:rotate-180" />
          ) : (
            <Moon className="h-5 w-5 group-hover:brand-primary transition-colors transition-normal group-hover:-rotate-12" />
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
