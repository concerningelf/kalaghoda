import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import CategoryFilters from './CategoryFilters';
import { CHAPTERS } from '../data/config';
import { getCategories } from '../utils/helpers';

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

            <div id="search-container" className={`fade-on-move ${isSearchExpanded ? 'expanded' : ''}`}>
                {/* Desktop Search Bar */}
                <div className="search-wrapper">
                    <i className="fa-solid fa-search search-icon"></i>
                    <Input
                        type="text"
                        id="search-input-desktop"
                        className="search-input-field pl-10"
                        placeholder="Search buildings, styles..."
                        value={searchTerm}
                        onChange={handleSearch}
                        onFocus={() => setIsSearchExpanded(true)}
                        onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                        autoComplete="off"
                    />
                </div>

                {/* Mobile Two-Pill Layout */}
                <div className="mobile-header-pills">
                    <AnimatePresence>
                        {!isSearchExpanded && (
                            <motion.a
                                href="about.html"
                                className="brand-pill"
                                initial={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0, marginRight: 0, borderWidth: 0 }}
                                animate={{ width: "auto", opacity: 1, paddingLeft: 20, paddingRight: 20, marginRight: 10, borderWidth: "1px" }}
                                exit={{ width: 0, opacity: 0, paddingLeft: 0, paddingRight: 0, marginRight: 0, borderWidth: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{ overflow: "hidden" }}
                            >
                                <div className="brand-text">
                                    <span className="brand-sub">Visual Audit</span>
                                    <span className="brand-main">Kala Ghoda</span>
                                </div>
                                <div className="brand-info-btn">
                                    <i className="fa-solid fa-circle-info"></i>
                                </div>
                            </motion.a>
                        )}
                    </AnimatePresence>

                    <motion.div
                        className="search-pill"
                    >
                        <i className="fa-solid fa-search"></i>
                        <Input
                            type="text"
                            id="search-input"
                            className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 text-base bg-transparent placeholder:text-neutral-400"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearch}
                            onFocus={() => setIsSearchExpanded(true)}
                            onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                            autoComplete="off"
                        />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            id="search-results"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {searchResults.map(record => (
                                <motion.div
                                    key={record.id}
                                    className="search-result-item"
                                    onClick={() => handleResultClick(record)}
                                    variants={itemVariants}
                                >
                                    <div className="result-title">{record.title}</div>
                                    <div className="result-meta">{record.year} • {getCategories(record).join(' · ')}</div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
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
