import React from "react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <div className="fixed bottom-10 left-0 right-0 z-[200] flex flex-col items-center p-4 pointer-events-none gap-2">
            <AnimatePresence>
                {toasts.filter(t => t.open).map(function ({ id, title, description, action, ...props }) {
                    return (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md text-white rounded-full px-6 py-3 shadow-lg flex items-center gap-4 min-w-[200px] max-w-[90vw]"
                            {...props}
                        >
                            <div className="flex flex-col gap-1">
                                {title && <div className="text-sm font-bold text-center">{title}</div>}
                                {description && (
                                    <div className="text-xs opacity-90 text-center">{description}</div>
                                )}
                            </div>
                            {action}
                            <button
                                onClick={() => props.onOpenChange?.(false)}
                                className="ml-auto hover:bg-white/20 rounded-full p-1 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
