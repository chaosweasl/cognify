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
import { Button } from "@/src/components/ui/Button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/src/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";

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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <div className="mr-4 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {navItems.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href}>
                  <Link href={href} className="flex w-full items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Logo */}
        <div className="mr-6 flex items-center space-x-2 md:mr-0">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image
              src="/favicon.svg"
              alt="Cognify"
              width={24}
              height={24}
              className="h-6 w-6"
              priority
            />
            <span className="hidden font-bold md:inline-block">Cognify</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <NavigationMenu className="mx-6 hidden md:flex">
          <NavigationMenuList>
            {navItems.map(({ href, label, icon: Icon }) => (
              <NavigationMenuItem key={href}>
                <Link href={href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <NotificationBell />
          
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
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
                className="relative h-10 w-10 rounded-full border-2 border-primary"
              >
                <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                  <Image
                    src={userProfile?.avatar_url || "/assets/nopfp.png"}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                    priority
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/nopfp.png";
                    }}
                  />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">
                    {userProfile?.display_name || "User"}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/dashboard" className="flex w-full items-center gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="flex w-full items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <form action={signOut} className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
