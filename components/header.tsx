"use client";

import { Menu, Sun, Moon } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import Image from "next/image";
import Link from "next/link";
import { useThemeStore } from "@/hooks/useTheme";
import { useEffect, useState } from "react";
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
} from "@/src/components/ui/dropdown-menu";

export function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile menu */}
        <div className="mr-4 lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem>
                <Link href="#features" className="w-full">Features</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="https://github.com/chaosweasl/cognify#readme" className="w-full">
                  How it Works
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="https://github.com/chaosweasl/cognify" className="w-full">GitHub</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/auth/login" className="w-full">
                  <Button size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Logo */}
        <div className="mr-6 flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/favicon.svg"
              alt="Cognify Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="hidden font-bold sm:inline-block">Cognify</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="#features" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Features
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="https://github.com/chaosweasl/cognify#readme" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  How it Works
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="https://github.com/chaosweasl/cognify" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  GitHub
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )
            ) : null}
          </Button>
          <Button asChild>
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
