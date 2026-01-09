import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { useTheme } from "./theme-provider";

const MapButton = ({
    id,
    onClick,
    iconClass,
    label,
    isActive,
    disabled,
    className,
    hideLabel = false,
    isMobile = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Button
            variant="ghost"
            size="icon"
            id={id}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "v-control-btn border transition-all duration-300",
                isActive && "active",
                disabled && "opacity-40 cursor-not-allowed",
                !hideLabel && !isMobile && "hover:w-auto",
                isMobile && "!w-10 !max-w-10 !min-w-10",
                className
            )}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
        >
            <div className="v-control-icon-wrapper">
                <i className={cn("fa-solid", iconClass)} />
            </div>

            {/* Label: Only shown on desktop hover */}
            {!hideLabel && !isMobile && (
                <span
                    className={cn(
                        "whitespace-nowrap text-[11px] font-extrabold uppercase tracking-widest overflow-hidden transition-all duration-300 ease-out",
                        !isHovered && "max-w-0 p-0 opacity-0",
                        isHovered && "max-w-[200px] px-3 opacity-100"
                    )}
                >
                    {label}
                </span>
            )}
        </Button>
    );
};

const MapControls = ({
    onZoomIn,
    onZoomOut,
    onResetNorth,
    onToggleTime,
    isTimeActive,
    is1883Mode,
    onToggle1883,
    is3DVisible,
    onToggle3D,
    onResetView,
    onLocate
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 }
    };

    const handleAction = (label, action) => {
        if (isMobile && label) {
            toast(label, {
                duration: 1500,
            });
        }
        action();
    };

    const isDimmed = is1883Mode;

    const buttons = [
        {
            id: "zoom-in-btn",
            onClick: onZoomIn,
            icon: "fa-plus",
            label: "Zoom In",
            hideLabel: true
        },
        {
            id: "zoom-out-btn",
            onClick: onZoomOut,
            icon: "fa-minus",
            label: "Zoom Out",
            hideLabel: true
        },
        {
            id: "compass-btn",
            onClick: () => handleAction("Reset North", onResetNorth),
            icon: "fa-arrow-up",
            label: "Reset North"
        },
        {
            id: "time-travel-btn",
            onClick: onToggleTime, // No toast for time travel
            icon: "fa-clock-rotate-left",
            label: "Time Travel",
            isActive: isTimeActive,
            disabled: is1883Mode
        },
        {
            id: "map-1883-btn",
            onClick: () => is1883Mode ? onToggle1883() : handleAction("1883 Map", onToggle1883),
            icon: "fa-map-location-dot",
            label: "1883 Map",
            isActive: is1883Mode,
            overrideDim: true
        },
        {
            id: "view-3d-btn",
            onClick: () => handleAction("3D View", onToggle3D),
            icon: "fa-cube",
            label: "3D View",
            isActive: is3DVisible,
            disabled: is1883Mode
        },
        {
            id: "reset-view-btn",
            onClick: () => handleAction("Reset View", onResetView),
            icon: "fa-compress",
            label: "Reset View"
        },
        {
            id: "locate-btn",
            onClick: () => handleAction("My Location", onLocate),
            icon: "fa-location-crosshairs",
            label: "My Location"
        },
        {
            id: "theme-toggle-btn",
            onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
            icon: theme === "dark" ? "fa-sun" : "fa-moon",
            label: theme === "dark" ? "Light Mode" : "Dark Mode",
            overrideDim: true
        }
    ];

    return (
        <motion.div
            id="vertical-controls"
            className="fixed right-5 bottom-8 flex flex-col items-end gap-2 z-[95] overflow-visible !max-h-none !h-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {buttons.map(btn => (
                <motion.div key={btn.id} variants={itemVariants}>
                    <MapButton
                        id={btn.id}
                        onClick={btn.onClick}
                        iconClass={btn.icon}
                        label={btn.label}
                        isActive={btn.isActive}
                        disabled={btn.disabled}
                        hideLabel={btn.hideLabel}
                        isMobile={isMobile}
                        className={isDimmed && !btn.overrideDim && !btn.disabled ? "opacity-40 pointer-events-none" : ""}
                    />
                </motion.div>
            ))}
        </motion.div>
    );
};

export default MapControls;
