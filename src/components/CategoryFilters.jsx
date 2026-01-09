import React, { useRef, useEffect, useState } from 'react';
import { MAP_CONFIG } from '../data/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button"
import { cn } from '@/lib/utils';

const CategoryFilters = ({
    disabledCategories,
    onToggle,
    onSolo,
    onReset,
    isFortWallVisible,
    onToggleFortWall
}) => {
    const scrollRef = useRef(null);
    const categories = Object.keys(MAP_CONFIG.colors);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            const isEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
            el.parentElement.classList.toggle('scrolled-end', isEnd);
        };

        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isFortWallVisible) {
            const wallInfo = document.getElementById('wall-info');
            if (wallInfo) {
                // Short delay to ensure animation has started/layout updated
                setTimeout(() => {
                    wallInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        }
    }, [isFortWallVisible]);

    const renderChip = (cat) => {
        const isHidden = disabledCategories.includes(cat);
        const color = MAP_CONFIG.colors[cat];
        const icon = MAP_CONFIG.icons[cat];
        const isSoloed = !disabledCategories.includes(cat) && categories.every(c => c === cat || disabledCategories.includes(c));

        return (
            <Badge
                key={cat}
                variant="outline"
                className={cn(
                    "rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all duration-200 select-none flex items-center gap-1.5 shrink-0 border",
                    isHidden ? "opacity-70 bg-muted text-muted-foreground border-border" : "text-white shadow-sm"
                )}
                onClick={() => onToggle(cat)}
                onContextMenu={(e) => { e.preventDefault(); onSolo(cat); }}
                style={{
                    backgroundColor: isHidden ? undefined : color,
                    borderColor: isHidden ? undefined : color,
                    // If isHidden, the className handles colors. If !isHidden, specific category color applies.
                }}
            >
                <i className={cn(`fa-solid ${icon}`, isHidden ? 'text-neutral-500' : 'text-white')} />
                {cat}
            </Badge>
        );
    };

    return (
        <>
            {/* Mobile Chip Bar */}
            <div className="chip-filter-wrapper">
                <div id="chip-filter-bar" ref={scrollRef} className="flex gap-2 overflow-x-auto px-5 py-2 items-center no-scrollbar">
                    <Badge
                        variant="secondary"
                        className="rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer shrink-0 bg-neutral-800 text-white hover:bg-neutral-700"
                        onClick={onReset}
                    >
                        All
                    </Badge>
                    {categories.map(renderChip)}
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer shrink-0 gap-1.5 flex items-center transition-colors shadow-sm",
                            isFortWallVisible ? "bg-[#c0392b] text-white border-[#c0392b]" : "bg-background text-[#c0392b] border-[#c0392b]",
                            "mr-5"
                        )}
                        onClick={onToggleFortWall}
                    >
                        <i className="fa-solid fa-archway" /> Toggle 1860 Fort Wall
                    </Badge>
                </div>
            </div>

            {/* Desktop Console/Sidebar (Hidden on Mobile via CSS) */}
            <div id="console">
                <div id="layers-header" onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                    <span><i className="fa-solid fa-layer-group"></i> Filter Layers</span>
                    <i id="layers-arrow" className={`fa-solid fa-chevron-down ${isOpen ? 'rotated' : ''}`}></i>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            id="layers-content-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            style={{ overflow: "hidden" }}
                            className="flex flex-col gap-2"
                        >
                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="default"
                                    className="w-full text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 h-8 shadow-sm shrink-0"
                                    onClick={onReset}
                                >
                                    RESET ALL LAYERS
                                </Button>

                                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col gap-2 p-1">
                                    {categories.map((cat) => {
                                        const isHidden = disabledCategories.includes(cat);
                                        const isSoloed = !disabledCategories.includes(cat) && categories.every(c => c === cat || disabledCategories.includes(c));
                                        const color = MAP_CONFIG.colors[cat];
                                        const icon = MAP_CONFIG.icons[cat];

                                        return (
                                            <div
                                                key={cat}
                                                className="flex items-center gap-2 shrink-0 h-8"
                                            >
                                                <div
                                                    className={cn(
                                                        "flex-1 flex items-center justify-start h-full px-3 rounded-md cursor-pointer transition-all shadow-sm",
                                                        isHidden ? "bg-muted text-muted-foreground" : "text-white hover:opacity-90"
                                                    )}
                                                    style={{ backgroundColor: isHidden ? undefined : color }}
                                                    onClick={() => onToggle(cat)}
                                                >
                                                    <i
                                                        className={cn(`fa-solid ${icon} text-sm w-4 text-center mr-2.5`, isHidden ? 'text-neutral-400' : 'text-white')}
                                                    />
                                                    <span className="text-[11px] font-extrabold uppercase tracking-wide">
                                                        {cat}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant={isSoloed ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-12 px-0 text-[10px] font-black",
                                                            isSoloed ? "bg-sky-600 hover:bg-sky-700 text-white border-sky-600" : "text-muted-foreground hover:text-foreground border-border dark:text-gray-300 dark:hover:text-white dark:bg-transparent dark:hover:bg-neutral-800"
                                                        )}
                                                        onClick={(e) => { e.stopPropagation(); onSolo(cat); }}
                                                        title="Show Only This Layer"
                                                    >
                                                        ONLY
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 w-12 px-0 text-[10px] font-black",
                                                            isHidden ? "bg-neutral-500 text-white border-neutral-500 hover:bg-neutral-600 dark:bg-primary dark:text-primary-foreground dark:border-primary dark:hover:bg-primary/90" : "text-muted-foreground hover:text-foreground border-border dark:text-gray-300 dark:hover:text-white dark:bg-transparent dark:hover:bg-neutral-800"
                                                        )}
                                                        onClick={() => onToggle(cat)}
                                                        title="Toggle Visibility"
                                                    >
                                                        {isHidden ? 'SHOW' : 'HIDE'}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="h-px bg-border my-2 w-full shrink-0" />

                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-8 flex items-center justify-start gap-2.5 px-3 mb-4 border transition-all shrink-0",
                                            isFortWallVisible
                                                ? "bg-red-950/20 text-red-700 border-red-200 dark:border-red-900 hover:bg-red-950/30"
                                                : "bg-background text-red-700 border-border hover:bg-muted"
                                        )}
                                        onClick={onToggleFortWall}
                                    >
                                        <i className="fa-solid fa-archway text-red-700" />
                                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-red-700">
                                            1860 Fort Wall
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default CategoryFilters;
