'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[2px] border border-[#9aa7b6] bg-white data-[state=checked]:bg-[#1f78b4] data-[state=checked]:border-[#1f78b4] data-[state=checked]:text-white focus-visible:border-[#1f78b4] focus-visible:ring-2 focus-visible:ring-[#1f78b4]/25 aria-invalid:border-destructive aria-invalid:ring-destructive/20 shadow-none outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
