import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
// 1. Importe a constante do novo arquivo que criamos
import { badgeVariants } from "./badge.variants";

// A interface continua funcionando, pois `badgeVariants` agora é importado
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// 2. Remova `badgeVariants` da exportação deste arquivo
export { Badge };