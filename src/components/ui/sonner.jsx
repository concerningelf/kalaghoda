import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
    return (
        <Sonner
            theme="system"
            className="toaster group"
            closeButton
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-950 group-[.toaster]:border-neutral-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:p-4 dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-white dark:group-[.toaster]:border-neutral-800 group-[.toaster]:font-['Lato'] group-[.toaster]:w-full group-[.toaster]:max-w-[250px] group-[.toaster]:relative group-[.toaster]:mx-auto group-[.toaster]:text-left",
                    title: "group-[.toast]:font-bold group-[.toast]:text-sm group-[.toast]:text-left",
                    description: "group-[.toast]:text-neutral-500 dark:group-[.toast]:text-neutral-400 group-[.toast]:text-sm group-[.toast]:text-left",
                    actionButton:
                        "group-[.toast]:bg-neutral-900 group-[.toast]:text-neutral-50 dark:group-[.toast]:bg-neutral-50 dark:group-[.toast]:text-neutral-900",
                    cancelButton:
                        "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-500 dark:group-[.toast]:bg-neutral-800 dark:group-[.toast]:text-neutral-400",
                    closeButton:
                        "group-[.toast]:!bg-transparent group-[.toast]:!border-0 group-[.toast]:!text-neutral-500 group-[.toast]:hover:!text-neutral-900 group-[.toast]:!absolute group-[.toast]:!right-0 group-[.toast]:!top-3 group-[.toast]:!left-auto group-[.toast]:!h-15 group-[.toast]:!w-15",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
