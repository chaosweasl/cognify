import { Github, Mail, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Top Row - Logo and Description */}
        <div className="mb-8 flex flex-col items-start justify-between md:flex-row">
          <div className="mb-4 flex items-center space-x-2 md:mb-0">
            <Image
              src="/favicon.svg"
              alt="Cognify Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">Cognify</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground md:text-right">
            Transform your study materials into intelligent flashcards with AI.
            Free, open-source, and designed for students who want to learn
            smarter.
          </p>
        </div>

        {/* Middle Row - Navigation Links */}
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 font-semibold">Product</h3>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="#features" 
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify#readme"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                How it Works
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify#readme"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Documentation
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/wiki"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                API Reference
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                href="https://github.com/chaosweasl/cognify/issues"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Report Issues
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/discussions"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Community
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify/blob/main/LICENSE"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                License
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border"></div>

        {/* Bottom Row - Copyright and Social Links */}
        <div className="flex flex-col items-center justify-between pt-8 md:flex-row">
          <p className="mb-4 text-sm text-muted-foreground md:mb-0">
            © 2025 Cognify. Open source and made with{" "}
            <Heart className="inline h-4 w-4 fill-red-500 text-red-500" /> for students
            everywhere.
          </p>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="https://github.com/chaosweasl/cognify">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="mailto:17daniel.dev@gmail.com">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
