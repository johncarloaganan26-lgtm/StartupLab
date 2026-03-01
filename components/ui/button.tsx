import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-[#1f7fe0] text-white border-2 border-[#1f7fe0] shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[1px] hover:bg-[#1a6dc4]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 border-2 border-destructive shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[1px] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-2 border-border bg-background shadow-[0_2px_0_0_rgba(0,0,0,0.06)] hover:bg-accent hover:text-accent-foreground active:shadow-none active:translate-y-[1px] dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-border shadow-[0_2px_0_0_rgba(0,0,0,0.06)] active:shadow-none active:translate-y-[1px]',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        excel: 'border border-[#ced4da] bg-gradient-to-b from-[#fdfdfd] via-[#f8f9fa] to-[#f1f3f5] text-[#495057] shadow-[0_2px_0_0_#dee2e6] hover:from-[#f8f9fa] hover:to-[#e9ecef] hover:border-[#adb5bd] active:shadow-none active:translate-y-[1px] dark:border-[#334155] dark:from-[#111827] dark:to-[#0f172a] dark:text-[#9fb0c7] dark:shadow-[0_2px_0_0_#1e293b]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-none gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-none px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
