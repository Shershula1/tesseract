import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6b15a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#100e0c] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#e6b15a] text-[#1a1208] hover:bg-[#f0c57a]",
        outline:
          "border border-[rgba(230,177,90,0.45)] bg-transparent text-[#f3eadf] hover:bg-[rgba(230,177,90,0.12)]",
        ghost: "text-[#cbbba6] hover:bg-white/5 hover:text-[#f3eadf]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs tracking-wide",
        icon: "size-9",
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
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
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
