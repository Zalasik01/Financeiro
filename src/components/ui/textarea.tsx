// src/components/ui/textarea.tsx (VERSÃO FINAL)

import * as React from "react";
import { cn } from "@/lib/utils";

import { type TextareaProps } from "./textarea.types";

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 outline-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// 2. A exportação agora contém apenas o componente.
export { Textarea };