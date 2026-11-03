/*! shadcn/ui adaptations, MIT (c) 2023 shadcn. Full license and source: NOTICE.txt. */
import type { VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Slot } from '@radix-ui/react-slot'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cva } from 'class-variance-authority'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...values: Parameters<typeof clsx>) {
  return twMerge(clsx(...values))
}

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border-border bg-background text-foreground hover:bg-accent',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-accent',
      },
      size: {
        default: 'min-h-9 px-3 py-2',
        sm: 'min-h-9 px-2.5 py-1.5 text-sm',
        icon: 'size-8 p-0 text-lg',
      },
    },
    defaultVariants: { variant: 'outline', size: 'sm' },
  },
)

export function Button({ className, variant, size, asChild, ...props }: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp type="button" data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" className={cn('min-h-9 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50', className)} {...props} />
}

export function Chevron({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={cn('size-4 shrink-0', className)} viewBox="0 0 16 16"><path d="m6 4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function Select({ id, label, value, onValueChange, options, className }: {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string, label: string, lang?: string, description?: React.ReactNode, group?: { id: string, label: string } }[]
  className?: string
}) {
  const groups = new Map<string, typeof options>()
  for (const option of options) {
    const key = option.group?.id ?? ''
    groups.set(key, [...(groups.get(key) ?? []), option])
  }
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <Tooltip label={options.find(option => option.value === value)?.label ?? label}>
        <SelectPrimitive.Trigger id={id} aria-label={label} className={cn('select-trigger', className)}>
          <SelectPrimitive.Value />
          <SelectPrimitive.Icon asChild><Chevron className="rotate-90" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
      </Tooltip>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="select-content" position="popper" sideOffset={4} collisionPadding={12}>
          <SelectPrimitive.ScrollUpButton className="select-scroll"><Chevron className="-rotate-90" /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {[...groups].map(([key, items]) => (
              <SelectPrimitive.Group key={key}>
                {items[0]?.group && <SelectPrimitive.Label className="select-group-label">{items[0].group.label}</SelectPrimitive.Label>}
                {items.map(option => (
                  <SelectPrimitive.Item key={option.value} value={option.value} textValue={option.label} aria-label={option.label} aria-describedby={option.description ? `${id}-${option.value}-description` : undefined} className="select-item" lang={option.lang}>
                    <span className="select-option-copy">
                      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                      {option.description && <span id={`${id}-${option.value}-description`} className="select-option-description">{option.description}</span>}
                    </span>
                    <SelectPrimitive.ItemIndicator className="select-indicator" aria-hidden="true">✓</SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Group>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="select-scroll"><Chevron className="rotate-90" /></SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function NavigationItem({ children, className, document, ...props }: ComponentProps<typeof Button> & { document?: boolean }) {
  return (
    <Button variant="ghost" className={cn('navigation-item', className)} {...props}>
      {document && <svg aria-hidden="true" className="navigation-icon" viewBox="0 0 20 20"><path d="M5 2.5h6l4 4v11H5z M11 2.5v4h4 M8 10h4 M8 13h4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" /></svg>}
      <span className="navigation-copy">{children}</span>
      <Chevron className="navigation-chevron" />
    </Button>
  )
}

export const TooltipProvider = TooltipPrimitive.Provider
export function Tooltip({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content sideOffset={8} collisionPadding={12} className="tooltip-content rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md">
          {label}
          <TooltipPrimitive.Arrow className="fill-foreground" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

export function CloseButton({ label, className, ...props }: Omit<ComponentProps<typeof Button>, 'children'> & { label: string }) {
  return <Tooltip label={label}><Button variant="ghost" size="icon" className={cn('size-[32px] min-h-[32px]', className)} aria-label={label} {...props}>×</Button></Tooltip>
}

export const Sheet = Dialog.Root
export const SheetTitle = Dialog.Title
export function SheetContent({ className, children, ...props }: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="sheet-overlay fixed inset-0 bg-foreground/30 backdrop-blur-[2px]" />
      <Dialog.Content aria-describedby={undefined} data-slot="sheet-content" className={cn('sheet-content fixed inset-y-0 flex flex-col bg-background text-foreground shadow-xl outline-none', className)} {...props}>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}
