import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import CategoryFilters from './CategoryFilters';
import { CHAPTERS } from '../data/config';
import { getCategories } from '../utils/helpers';
import { Search } from 'lucide-react';

const Header = ({
    onSelectRecord,
    disabledCategories,
    onToggle,
    onSolo,
    onReset,
    isFortWallVisible,
    onToggleFortWall
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchTerm(query);

        if (query.length < 1) {
            setSearchResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const results = CHAPTERS
            .filter(record => {
                const titleMatch = record.title.toLowerCase().includes(lowerQuery);
                const descMatch = record.description.toLowerCase().includes(lowerQuery);
                const categories = getCategories(record);
                const categoryMatch = categories.some(cat => cat.toLowerCase().includes(lowerQuery));
                return titleMatch || descMatch || categoryMatch;
            })
            .sort((a, b) => {
                // Priority 1: Title Starts With
                const aTitleStart = a.title.toLowerCase().startsWith(lowerQuery);
                const bTitleStart = b.title.toLowerCase().startsWith(lowerQuery);
                if (aTitleStart && !bTitleStart) return -1;
                if (!aTitleStart && bTitleStart) return 1;

                // Priority 2: Title Contains
                const aTitle = a.title.toLowerCase().includes(lowerQuery);
                const bTitle = b.title.toLowerCase().includes(lowerQuery);
                if (aTitle && !bTitle) return -1;
                if (!aTitle && bTitle) return 1;

                // Priority 3: Category Match
                const aCats = getCategories(a);
                const bCats = getCategories(b);
                const aCatMatch = aCats.some(cat => cat.toLowerCase().includes(lowerQuery));
                const bCatMatch = bCats.some(cat => cat.toLowerCase().includes(lowerQuery));

                if (aCatMatch && !bCatMatch) return -1;
                if (!aCatMatch && bCatMatch) return 1;

                return 0;
            })
            .slice(0, 10);

        setSearchResults(results);
    };

    const handleResultClick = (record) => {
        onSelectRecord(record);
        setSearchTerm('');
        setSearchResults([]);
        setIsSearchExpanded(false);
    };

    // Sleek spring configuration for smooth animations
    const springConfig = {
        type: 'spring',
        stiffness: 350,
        damping: 30,
        mass: 0.8
    };

    const containerVariants = {
        hidden: { opacity: 0, y: -8 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                ...springConfig,
                staggerChildren: 0.04,
                delayChildren: 0.05
            }
        },
        exit: {
            opacity: 0,
            y: -8,
            transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -12 },
        visible: {
            opacity: 1,
            x: 0,
            transition: springConfig
        }
    };

    return (
        <header id="header" className="fade-on-move">
            <div className="flex items-start justify-between px-5 pt-5">
                <div className="flex-1">
                    <h1 className="p-0 m-0">
                        <span className="title-sub block">Visual Audit</span>
                        <span className="title-main block">Kala Ghoda</span>
                    </h1>
                </div>
                <div className="flex items-start">
                    <a
                        href="about.html"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "info-icon-btn rounded-full -mr-2")}
                        title="About This Project"
                    >
                        <i className="fa-solid fa-circle-info text-2xl"></i>
                    </a>
                </div>
            </div>

            <div id="mobile-title">
                <span className="m-sub">Visual Audit</span>
                <span className="m-main">Kala Ghoda</span>
            </div>

            <div id="search-container" className={cn("fade-on-move", isSearchExpanded && "expanded")}>
                <Command className="bg-transparent overflow-visible" shouldFilter={false}>
                    {/* Desktop Search Bar */}
                    <div className="hidden md:block">
                        <div className="rounded-full border border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors px-1">
                            <CommandInput
                                placeholder="Search buildings, styles..."
                                value={searchTerm}
                                onValueChange={(v) => handleSearch({ target: { value: v } })}
                                onFocus={() => setIsSearchExpanded(true)}
                                onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                                className="h-10 border-none focus-visible:ring-0 placeholder:text-neutral-500"
                            />
                        </div>
                    </div>

                    {/* Mobile Two-Pill Layout */}
                    <div className="mobile-header-pills flex md:hidden items-center gap-2 w-full px-5">
                        <AnimatePresence mode="popLayout">
                            {!isSearchExpanded && (
                                <motion.a
                                    href="about.html"
                                    className="h-[50px] flex items-center gap-3 bg-background border border-border/80 shadow-lg px-4 shrink-0 rounded-[24px]"
                                    initial={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0, borderWidth: 0 }}
                                    animate={{ width: "auto", opacity: 1, paddingLeft: 16, paddingRight: 16, borderWidth: "1px" }}
                                    exit={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0, borderWidth: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div className="flex flex-col justify-center gap-[1px]">
                                        <span className="font-['Lato'] text-[9px] font-extrabold text-[#666] uppercase tracking-[2px] leading-none">Visual Audit</span>
                                        <span className="font-['Labrada'] text-[19px] font-bold text-[#bfa05a] leading-none">Kala Ghoda</span>
                                    </div>
                                    <div className="w-[28px] h-[28px] bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground text-[14px] shrink-0">
                                        <i className="fa-solid fa-circle-info"></i>
                                    </div>
                                </motion.a>
                            )}
                        </AnimatePresence>

                        <motion.div
                            layout
                            className="flex-1 rounded-[24px] border border-border/80 bg-background shadow-lg h-[50px] flex items-center overflow-hidden"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        >
                            <CommandInput
                                placeholder="Search..."
                                value={searchTerm}
                                onValueChange={(v) => handleSearch({ target: { value: v } })}
                                onFocus={() => setIsSearchExpanded(true)}
                                onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                                className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-[16px] bg-transparent placeholder:text-neutral-400 flex-1 min-w-0"
                            />
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {isSearchExpanded && searchTerm.length > 0 && (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute top-[calc(100%+16px)] left-0 right-0 z-[1000] rounded-2xl border border-border/80 bg-white dark:bg-background text-popover-foreground shadow-2xl outline-none mt-0 overflow-hidden"
                            >
                                <CommandList className="max-h-[60vh] overflow-y-auto p-0">
                                    {searchResults.length === 0 ? (
                                        <CommandEmpty className="py-10 text-center text-sm opacity-50 flex flex-col items-center gap-3">
                                            <Search className="h-5 w-5 opacity-20" />
                                            <span>No buildings found for "{searchTerm}"</span>
                                        </CommandEmpty>
                                    ) : (
                                        <CommandGroup className="p-2">
                                            {searchResults.map(record => (
                                                <CommandItem
                                                    key={record.id}
                                                    onSelect={() => handleResultClick(record)}
                                                    className="search-result-item flex flex-col items-start py-4 px-5 rounded-xl cursor-pointer transition-colors m-1 data-[selected='true']:bg-accent dark:data-[selected='true']:bg-black/20"
                                                >
                                                    <div className="result-title font-bold text-[15px]">{record.title}</div>
                                                    <div className="result-meta text-[11px] uppercase tracking-widest opacity-60 font-medium mt-1">
                                                        {record.year} • {getCategories(record).join(' · ')}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Command>
            </div>

            <CategoryFilters
                disabledCategories={disabledCategories}
                onToggle={onToggle}
                onSolo={onSolo}
                onReset={onReset}
                isFortWallVisible={isFortWallVisible}
                onToggleFortWall={onToggleFortWall}
            />
        </header>
    );
};

export default Header;
