import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        gradient: "bg-gradient-to-r from-[var(--accent-amber)] to-[var(--accent-coral)] text-white shadow-lg hover:shadow-xl transition-shadow",
        outline:
          "border-2 border-border bg-white text-foreground hover:border-[var(--accent-amber)] hover:bg-[var(--accent)]/30 transition-colors",
        secondary:
          "bg-secondary text-foreground hover:bg-[var(--accent)]/50 transition-colors",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link: "text-[var(--accent-amber)] underline-offset-4 hover:underline",
        violet: "bg-gradient-to-r from-[var(--accent-violet)] to-[var(--accent-violet-light)] text-white shadow-lg hover:shadow-xl transition-shadow",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 text-sm rounded-lg",
        lg: "px-8 py-4 text-lg",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
