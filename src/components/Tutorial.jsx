import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Tutorial = ({ visible, onDismiss }) => {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    id="tutorial-overlay"
                    className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="w-full max-w-sm"
                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, y: 50, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <Card className="max-w-[360px] w-full border-none shadow-2xl bg-background/80 backdrop-blur-md overflow-hidden p-0">
                            <CardHeader className="text-center pb-2">
                                <div className="text-4xl mb-2">🗺️</div>
                                <CardTitle className="text-3xl font-bold text-[#d4af37]" style={{ fontFamily: "'Labrada', serif" }}>
                                    Kala Ghoda
                                </CardTitle>
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Heritage Map</div>
                            </CardHeader>
                            <CardContent className="grid gap-4 pt-4">
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted border border-border">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                        <i className="fa-solid fa-hand-pointer text-lg"></i>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">Tap markers</strong> to explore heritage sites
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted border border-border">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                                        <i className="fa-solid fa-filter text-lg"></i>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">Tap chips</strong> to show/hide layer types
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted border border-border">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                                        <i className="fa-solid fa-hand text-lg"></i>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">Long-press chips</strong> for solo mode
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted border border-border">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                                        <i className="fa-solid fa-clock-rotate-left text-lg"></i>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <strong className="text-foreground">Time slider</strong> to filter by year built
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full mt-2 font-bold bg-[#c0392b] hover:bg-[#a93226] text-white"
                                    onClick={onDismiss}
                                >
                                    Got it, let's explore
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Tutorial;
