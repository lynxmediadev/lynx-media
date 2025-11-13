/**
 * ============================================================================
 * Archivo: src/components/ui/button.tsx
 * Propósito (peras y manzanas):
 * - Componente <Button> basado en shadcn/ui, con variantes (default, secondary,
 *   destructive, outline, ghost, link) y tamaños (default, sm, lg, icon).
 * - Exporta:
 *    - `Button` (React.forwardRef<HTMLButtonElement>)
 *    - `buttonVariants` (para componer clases si necesitas un <Link> con estilo btn)
 * - Soluciona el error "no exported member 'Button'" asegurando que exista
 *   una exportación con ese nombre en el módulo "@/components/ui/button".
 * Por qué:
 * - En Windows, tener `Button.tsx` (mayúscula) vacío colisiona con el import en
 *   minúscula. Este archivo crea la exportación correcta y debe convivir sin
 *   un duplicado en mayúscula (elimina/renombra el anterior).
 * ============================================================================
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Variantes de estilo del botón (shadcn/ui-style)
const buttonVariants = cva(
  // Clases base
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background " +
    "transition-[color,background-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost:
          "hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3",
        lg:      "h-10 rounded-md px-6",
        icon:    "h-9 w-9",
      },
      // Permite renderizar como-child (p. ej., <Link> envuelto)
      asChild: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      asChild: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Componente Button:
 * - Usa Slot cuando `asChild` es true (por ejemplo, para <Link>), de lo contrario <button>.
 * - Acepta `variant` y `size` según `buttonVariants`.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, asChild }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
