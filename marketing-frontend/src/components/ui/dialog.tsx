import * as React from 'react'
import * as Primitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
export const Dialog = Primitive.Root
export const DialogTitle = Primitive.Title
export const DialogDescription = Primitive.Description
export function DialogContent({children, ...props}: React.ComponentPropsWithoutRef<typeof Primitive.Content>) { return <Primitive.Portal><Primitive.Overlay className="studio-overlay"/><Primitive.Content className="studio-dialog" {...props}>{children}<Primitive.Close className="studio-dialog-close" aria-label="关闭"><X size={18}/></Primitive.Close></Primitive.Content></Primitive.Portal> }
