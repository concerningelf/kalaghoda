import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const TimeSlider = ({ currentYear, onChange, onClose }) => {
    const minYear = 1850;
    const maxYear = 2025;

    const handleSliderChange = (value) => {
        onChange(value[0]);
    };

    return (
        <>
            {/* Backdrop - Mobile Only */}
            <motion.div
                className="fixed inset-0 bg-black/20 z-[115] md:hidden"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            />

            {/* Time Widget Card */}
            <motion.div
                className="fixed bottom-10 left-1/2 z-[120] w-[90%] max-w-[400px]"
                initial={{ y: 100, opacity: 0, x: '-50%' }}
                animate={{ y: 0, opacity: 1, x: '-50%' }}
                exit={{ y: 100, opacity: 0, x: '-50%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-md">
                    {/* Close Button - Mobile Only */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    <CardContent className="pt-6 pb-5 px-8">
                        {/* Year Display */}
                        <div className="text-center mb-4">

                            <h2
                                className="text-2xl font-normal text-[#c0392b]"
                                style={{ fontFamily: "'Labrada', serif" }}
                            >
                                {currentYear === maxYear ? 'Present Day' : `Year: ${currentYear}`}
                            </h2>
                        </div>

                        {/* Slider */}
                        <Slider
                            value={[currentYear]}
                            onValueChange={handleSliderChange}
                            min={minYear}
                            max={maxYear}
                            step={1}
                            className="py-4"
                        />

                        {/* Range Labels */}
                        <div className="flex justify-between text-xs font-bold text-muted-foreground mt-1 px-1">
                            <span>{minYear}</span>
                            <span>Present</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
};

export default TimeSlider;
