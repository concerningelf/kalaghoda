import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategories, optimizeWikiImage } from '../utils/helpers';
import { MAP_CONFIG } from '../data/config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselDots,
} from '@/components/ui/carousel';
import { X, Navigation, Share2, Calendar, PenTool, Hammer, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Spring config
const fastSpring = {
    type: 'spring',
    stiffness: 400,
    damping: 35,
    mass: 0.5
};

// Simple carousel arrows that don't use any framework components
const CarouselArrows = ({ api }) => {
    if (!api) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => api.scrollPrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                style={{ transform: 'translateY(-50%)' }}
            >
                <ChevronLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <button
                type="button"
                onClick={() => api.scrollNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                style={{ transform: 'translateY(-50%)' }}
            >
                <ChevronRight className="h-5 w-5 text-neutral-700" />
            </button>
        </>
    );
};

// The image carousel section
const ImageCarousel = ({ images, title, onClose }) => {
    const [api, setApi] = useState(null);
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!api) return;

        setCurrent(api.selectedScrollSnap());
        api.on('select', () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    return (
        <div className="relative w-full">
            {/* Close Button */}
            <button
                type="button"
                className="absolute top-3 right-3 z-[60] h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 flex items-center justify-center"
                onClick={onClose}
            >
                <X className="h-5 w-5" />
            </button>

            <Carousel className="w-full" opts={{ loop: images.length > 1 }} setApi={setApi}>
                <CarouselContent className="m-0">
                    {images.map((img, idx) => (
                        <CarouselItem key={idx} className="p-0">
                            <div className="w-full bg-muted/20 h-[45vh] md:h-[45vh]">
                                <img
                                    src={optimizeWikiImage(img)}
                                    alt={`${title} - Image ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {images.length > 1 && (
                <>
                    <CarouselArrows api={api} />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                className={`h-2 rounded-full transition-all ${idx === current ? 'bg-white w-5' : 'bg-white/50 w-2'
                                    }`}
                                onClick={() => api?.scrollTo(idx)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// Content section (shared between mobile and desktop)
const PanelContent = ({ selectedRecord, onClose, scrollAreaRef, checkScroll }) => {
    const images = selectedRecord.images && Array.isArray(selectedRecord.images)
        ? selectedRecord.images
        : [selectedRecord.image];

    const categories = getCategories(selectedRecord);
    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedRecord.location.center[1]},${selectedRecord.location.center[0]}&travelmode=walking`;

    const infoItems = [
        { icon: Calendar, label: 'Year', value: selectedRecord.year },
        { icon: PenTool, label: 'Architect', value: selectedRecord.architect || 'Unknown' },
        { icon: Hammer, label: 'Builder', value: selectedRecord.builder || 'Unknown' }
    ];

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?site=${encodeURIComponent(selectedRecord.id)}`;
        const shareData = {
            title: `${selectedRecord.title} - Kala Ghoda Heritage Map`,
            text: selectedRecord.description,
            url: shareUrl
        };

        if (navigator.share && navigator.canShare?.(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        try {
            await navigator.clipboard?.writeText(shareUrl);
            alert('Link copied to clipboard!');
        } catch {
            prompt('Copy this link:', shareUrl);
        }
    };

    return (
        <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={checkScroll}
        >
            <div data-vaul-no-drag>
                {/* Inner wrapper for ResumeObserver tracking */}
                <ImageCarousel images={images} title={selectedRecord.title} onClose={onClose} />

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <Badge
                                key={cat}
                                className="px-3 py-1 text-xs font-bold uppercase tracking-wide text-white border-0 shadow-sm"
                                style={{ backgroundColor: MAP_CONFIG.colors[cat] || '#333' }}
                            >
                                {cat}
                            </Badge>
                        ))}
                    </div>

                    {/* Title */}
                    <h2
                        className="text-2xl font-bold text-foreground tracking-tight"
                        style={{ fontFamily: "'Labrada', serif" }}
                    >
                        {selectedRecord.title}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed text-[15px]">
                        {selectedRecord.description}
                    </p>

                    {/* Info Card - Glassy and Themed */}
                    <Card className="bg-muted/30 backdrop-blur-sm border-border/50 shadow-none">
                        <CardContent className="p-4 space-y-3">
                            {infoItems.map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <item.icon className="h-4 w-4 text-primary" />
                                    <span className="text-sm text-muted-foreground w-20 font-medium">{item.label}</span>
                                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button asChild className="flex-1 bg-[#2980b9] hover:bg-[#2471a3] text-white shadow-md transition-all active:scale-95">
                            <a
                                href={navUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2"
                            >
                                <Navigation className="h-4 w-4" />
                                <span className="font-semibold">Navigate</span>
                            </a>
                        </Button>
                        <Button variant="outline" className="flex-1 border-border/50 bg-background/50 hover:bg-accent transition-all active:scale-95" onClick={handleShare}>
                            <Share2 className="h-4 w-4 mr-2" />
                            <span className="font-semibold">Share</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main SidePanel component
const SidePanel = ({ selectedRecord, onClose }) => {
    const scrollAreaRef = useRef(null);
    const [canScrollDown, setCanScrollDown] = useState(false);
    const isMobile = window.innerWidth <= 768;

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const checkScroll = () => {
        if (scrollAreaRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
            setCanScrollDown(scrollTop + clientHeight < scrollHeight - 20);
        }
    };

    useEffect(() => {
        const updateScrollState = () => {
            if (scrollAreaRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
                setCanScrollDown(scrollHeight > clientHeight + 10 && scrollTop + clientHeight < scrollHeight - 10);
            }
        };

        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0;
            const observer = new ResizeObserver(updateScrollState);
            observer.observe(scrollAreaRef.current);
            if (scrollAreaRef.current.firstElementChild) {
                observer.observe(scrollAreaRef.current.firstElementChild);
            }
            updateScrollState();
            setTimeout(updateScrollState, 200);
            return () => observer.disconnect();
        }
    }, [selectedRecord]);

    const handleScrollHintClick = () => {
        scrollAreaRef.current?.scrollBy({ top: 300, behavior: 'smooth' });
    };

    // Local state for mobile drawer animation
    const [mobileOpen, setMobileOpen] = useState(true);

    // Reset mobile open state when record changes
    useEffect(() => {
        if (isMobile) setMobileOpen(true);
    }, [selectedRecord, isMobile]);

    const handleMobileClose = () => {
        setMobileOpen(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const handleMobileOpenChange = (open) => {
        setMobileOpen(open);
        if (!open) {
            setTimeout(onClose, 300);
        }
    };

    // MOBILE: Use Vaul Drawer with drag-to-dismiss
    if (isMobile) {
        return (
            <Drawer open={mobileOpen} onOpenChange={handleMobileOpenChange} modal={false}>
                <DrawerContent className="h-[75vh] max-h-[75vh] flex flex-col bg-background/80 backdrop-blur-xl border-t border-border/50" showOverlay={false}>
                    {/* Custom Handle Overlay - Large Hit Area */}
                    <div className="absolute top-0 left-0 right-0 h-12 z-50 flex justify-center pt-3 cursor-grab active:cursor-grabbing">
                        <div className="w-12 h-1.5 bg-foreground/20 rounded-full shadow-sm" />
                    </div>

                    <PanelContent
                        selectedRecord={selectedRecord}
                        onClose={handleMobileClose}
                        scrollAreaRef={scrollAreaRef}
                        checkScroll={checkScroll}
                    />

                    {/* Scroll Hint */}
                    {canScrollDown && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-50">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur hover:bg-background pointer-events-auto border border-border/50"
                                onClick={handleScrollHintClick}
                            >
                                <motion.div
                                    animate={{ y: [0, 4, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                >
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                </motion.div>
                            </Button>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        );
    }

    // DESKTOP: Traditional slide-in panel
    return (
        <>
            {/* Backdrop */}
            <motion.div
                className="fixed inset-0 bg-black/20 z-[199] backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
                className="fixed right-0 top-0 h-full w-[400px] bg-background/70 backdrop-blur-xl border-l border-border/50 shadow-2xl z-[200] flex flex-col rounded-l-2xl overflow-hidden"
            >
                <PanelContent
                    selectedRecord={selectedRecord}
                    onClose={onClose}
                    scrollAreaRef={scrollAreaRef}
                    checkScroll={checkScroll}
                />
            </motion.div>
        </>
    );
};

export default SidePanel;
