"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

const CollapsibleContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    { children, open = false, onOpenChange = () => {}, className, ...props },
    ref
  ) => {
    return (
      <CollapsibleContext.Provider value={{ open, onOpenChange }}>
        <div ref={ref} className={cn(className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = React.forwardRef<
  HTMLDivElement,
  CollapsibleTriggerProps
>(({ children, className, asChild, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(CollapsibleContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(!open),
      ref,
      className: cn(className, (children.props as any).className),
      ...props,
    } as any);
  }

  return (
    <div
      ref={ref}
      className={cn("cursor-pointer", className)}
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
    </div>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ children, className, ...props }, ref) => {
  const { open } = React.useContext(CollapsibleContext);

  if (!open) return null;

  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
