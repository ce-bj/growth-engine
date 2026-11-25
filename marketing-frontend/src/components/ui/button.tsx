import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3989ff] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#3989ff] text-white hover:bg-[#1f6fdb]',
        destructive: 'bg-[#dc2626] text-white hover:bg-[#b91c1c]',
        outline: 'border border-[rgba(15,23,42,0.14)] bg-white hover:bg-[#f5f7fb] text-[#0f172a]',
        secondary: 'bg-[#f5f7fb] text-[#0f172a] hover:bg-[#eef2f7]',
        ghost: 'hover:bg-[rgba(15,23,42,0.04)] text-[#475569]',
        link: 'text-[#1d4ed8] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-8 rounded px-3',
        lg: 'h-8 rounded px-4',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
