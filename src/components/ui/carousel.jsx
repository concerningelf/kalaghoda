import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

const CarouselContext = React.createContext(null)

function useCarousel() {
    const context = React.useContext(CarouselContext)
    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />")
    }
    return context
}

const Carousel = React.forwardRef(
    (
        {
            orientation = "horizontal",
            opts,
            setApi,
            plugins,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const [carouselRef, api] = useEmblaCarousel(
            {
                ...opts,
                axis: orientation === "horizontal" ? "x" : "y",
            },
            plugins
        )
        const [selectedIndex, setSelectedIndex] = React.useState(0)
        const [scrollSnaps, setScrollSnaps] = React.useState([])

        const onSelect = React.useCallback((api) => {
            if (!api) return
            setSelectedIndex(api.selectedScrollSnap())
        }, [])

        const scrollPrev = React.useCallback(() => {
            if (api) api.scrollPrev()
        }, [api])

        const scrollNext = React.useCallback(() => {
            if (api) api.scrollNext()
        }, [api])

        const scrollTo = React.useCallback((index) => {
            if (api) api.scrollTo(index)
        }, [api])

        React.useEffect(() => {
            if (!api || !setApi) return
            setApi(api)
        }, [api, setApi])

        React.useEffect(() => {
            if (!api) return
            setScrollSnaps(api.scrollSnapList())
            onSelect(api)
            api.on("reInit", onSelect)
            api.on("select", onSelect)
            return () => {
                api?.off("select", onSelect)
            }
        }, [api, onSelect])

        return (
            <CarouselContext.Provider
                value={{
                    carouselRef,
                    api,
                    opts,
                    orientation,
                    scrollPrev,
                    scrollNext,
                    scrollTo,
                    selectedIndex,
                    scrollSnaps,
                }}
            >
                <div
                    ref={ref}
                    className={cn("relative", className)}
                    role="region"
                    aria-roledescription="carousel"
                    {...props}
                >
                    {children}
                </div>
            </CarouselContext.Provider>
        )
    }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel()

    return (
        <div ref={carouselRef} className="overflow-hidden">
            <div
                ref={ref}
                className={cn(
                    "flex",
                    orientation === "horizontal" ? "" : "flex-col",
                    className
                )}
                {...props}
            />
        </div>
    )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            role="group"
            aria-roledescription="slide"
            className={cn(
                "min-w-0 shrink-0 grow-0 basis-full",
                className
            )}
            {...props}
        />
    )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef(
    ({ className, ...props }, ref) => {
        const { scrollPrev, api } = useCarousel()

        const handleClick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            scrollPrev()
        }

        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 z-20",
                    "h-10 w-10 rounded-full",
                    "bg-white/80 hover:bg-white",
                    "flex items-center justify-center",
                    "shadow-lg border-0",
                    "transition-colors cursor-pointer",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]",
                    className
                )}
                onClick={handleClick}
                disabled={!api}
                {...props}
            >
                <ChevronLeft className="h-5 w-5 text-neutral-700" />
            </button>
        )
    }
)
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef(
    ({ className, ...props }, ref) => {
        const { scrollNext, api } = useCarousel()

        const handleClick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            scrollNext()
        }

        return (
            <button
                ref={ref}
                type="button"
                className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 z-20",
                    "h-10 w-10 rounded-full",
                    "bg-white/80 hover:bg-white",
                    "flex items-center justify-center",
                    "shadow-lg border-0",
                    "transition-colors cursor-pointer",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]",
                    className
                )}
                onClick={handleClick}
                disabled={!api}
                {...props}
            >
                <ChevronRight className="h-5 w-5 text-neutral-700" />
            </button>
        )
    }
)
CarouselNext.displayName = "CarouselNext"

const CarouselDots = React.forwardRef(({ className, ...props }, ref) => {
    const { scrollTo, selectedIndex, scrollSnaps } = useCarousel()

    if (scrollSnaps.length <= 1) return null

    return (
        <div
            ref={ref}
            className={cn("flex justify-center gap-2", className)}
            {...props}
        >
            {scrollSnaps.map((_, index) => (
                <button
                    key={index}
                    type="button"
                    className={cn(
                        "h-2 rounded-full transition-all",
                        index === selectedIndex
                            ? "bg-white w-5"
                            : "bg-white/50 hover:bg-white/75 w-2"
                    )}
                    onClick={() => scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
    )
})
CarouselDots.displayName = "CarouselDots"

export {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
    CarouselDots,
    useCarousel,
}
