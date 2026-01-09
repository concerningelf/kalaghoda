import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SidePanel from './components/SidePanel.jsx';
import Map from './components/Map';
import Header from './components/Header';
import TimeSlider from './components/TimeSlider';
import MapControls from './components/MapControls';
import Tutorial from './components/Tutorial';
import './index.css';
import './App.css';
import { MAP_CONFIG, CHAPTERS } from './data/config';
import { Toaster } from '@/components/ui/sonner';
import { toast } from "sonner";
import { X } from "lucide-react";
import { ThemeProvider } from "./components/theme-provider";

import { useTheme } from "./components/theme-provider";

function AppContent() {
  const mapRef = useRef(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentYear, setCurrentYear] = useState(2025);
  const [disabledCategories, setDisabledCategories] = useState([]);
  const [is1883Mode, setIs1883Mode] = useState(false);
  const [isFortWallVisible, setIsFortWallVisible] = useState(false);
  const [is3DBuildingsVisible, setIs3DBuildingsVisible] = useState(true);
  const [isTimeSliderOpen, setIsTimeSliderOpen] = useState(() => window.innerWidth > 768);
  const [showTutorial, setShowTutorial] = useState(() => {
    // Only show tutorial on mobile and if not seen before
    const isMobile = window.innerWidth <= 768;
    const hasSeenTutorial = localStorage.getItem('tutorialSeen');
    return isMobile && !hasSeenTutorial;
  });

  const { theme } = useTheme();

  // Loading state
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Map Loaded Callback
  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) loadingBar.style.width = '100%';
  }, []);

  // Handle Loading Screen Final Dismissal
  useEffect(() => {
    if (isMapLoaded) {
      const loadingScreen = document.getElementById('loading-screen');
      const loadingText = document.getElementById('loading-text');
      if (loadingText) loadingText.innerText = 'Ready!';

      const timer = setTimeout(() => {
        if (loadingScreen) {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
          }, 800);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMapLoaded]);

  // Handle tutorial dismiss
  const handleTutorialDismiss = useCallback(() => {
    localStorage.setItem('tutorialSeen', 'true');
    setShowTutorial(false);
  }, []);

  // Sync 1883 mode class to body element for CSS styling
  useEffect(() => {
    if (is1883Mode) {
      document.body.classList.add('mode-1883');
    } else {
      document.body.classList.remove('mode-1883');
    }
    return () => {
      document.body.classList.remove('mode-1883');
    };
  }, [is1883Mode]);

  // Handle URL query parameter for deep linking (shared links)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('site');

    if (siteId && isMapLoaded) {
      const record = CHAPTERS.find(r => r.id === siteId);
      if (record) {
        setSelectedRecord(record);
        if (record.location) {
          // Use a short delay to ensure map is fully ready
          setTimeout(() => {
            mapRef.current?.flyTo(record.location.center, 18);
          }, 500);
        }
      }
    }
  }, [isMapLoaded]); // Re-run when map is loaded

  const handleSelectRecord = useCallback((record) => {
    setSelectedRecord(record);
    if (record.location) {
      mapRef.current?.flyTo(record.location.center, 18);
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const toggleCategory = useCallback((category) => {
    setDisabledCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const setSoloCategory = useCallback((category) => {
    const allCategories = Object.keys(MAP_CONFIG.colors);
    const otherCategories = allCategories.filter(c => c !== category);

    setDisabledCategories(prev => {
      const isTargetEnabled = !prev.includes(category);
      const areOthersDisabled = otherCategories.every(c => prev.includes(c));
      const isCurrentlySoloed = isTargetEnabled && areOthersDisabled;

      if (isCurrentlySoloed) {
        return []; // Reset to show all
      } else {
        return otherCategories; // Solo this category
      }
    });
  }, []);

  const resetCategories = useCallback(() => {
    setDisabledCategories([]);
  }, []);

  const handleToggleFortWall = useCallback(() => {
    setIsFortWallVisible(prev => {
      const newState = !prev;
      if (newState) {
        // Use setTimeout to defer the toast call and avoid state updater side-effects / StrictMode double-fire
        setTimeout(() => {
          toast.custom((t) => (
            <div className="bg-[#FFF5F5] relative border-l-[6px] border-l-red-700 shadow-xl rounded-lg p-5 font-['Lato'] w-full max-w-[356px] pointer-events-auto flex flex-col gap-2 mx-auto">
              <div className="flex justify-between items-start gap-3">
                <div className="text-red-700 uppercase font-black tracking-wider text-sm leading-tight">
                  The Invisible Ramparts
                </div>
                <button
                  onClick={() => toast.dismiss(t)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors -mt-1 -mr-2 p-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="text-neutral-700 leading-normal text-sm">
                This dashed line traces the demolished fortifications of the Bombay Fort (removed 1862).
              </div>
            </div>
          ), {
            id: 'fort-wall-toast', // Prevent duplicates
            duration: Infinity, // Keep it visible until dismissed
            className: '!bg-transparent !border-0 !shadow-none !p-0 !pointer-events-auto flex justify-center w-full', // Ensure flex justify-center for centering
            unstyled: true
          });
        }, 0);
      }
      return newState;
    });
  }, []);

  return (
    <div className={`app-container ${is1883Mode ? 'mode-1883' : ''}`}>
      <Map
        key={theme} // Force remount on theme change
        ref={mapRef}
        selectedRecord={selectedRecord}
        onSelectRecord={handleSelectRecord}
        currentYear={currentYear}
        disabledCategories={disabledCategories}
        is1883Mode={is1883Mode}
        isFortWallVisible={isFortWallVisible}
        is3DBuildingsVisible={is3DBuildingsVisible}
        onMapLoad={handleMapLoad}
      />

      <Header
        onSelectRecord={handleSelectRecord}
        disabledCategories={disabledCategories}
        onToggle={toggleCategory}
        onSolo={setSoloCategory}
        onReset={resetCategories}
        isFortWallVisible={isFortWallVisible}
        onToggleFortWall={handleToggleFortWall}
      />

      <AnimatePresence>
        {isTimeSliderOpen && (
          <TimeSlider
            currentYear={currentYear}
            onChange={setCurrentYear}
            onClose={() => setIsTimeSliderOpen(false)}
          />
        )}
      </AnimatePresence>

      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onResetNorth={() => mapRef.current?.resetNorth()}
        onToggleTime={() => setIsTimeSliderOpen(!isTimeSliderOpen)}
        isTimeActive={isTimeSliderOpen}
        is1883Mode={is1883Mode}
        onToggle1883={() => setIs1883Mode(!is1883Mode)}
        is3DVisible={is3DBuildingsVisible}
        onToggle3D={() => setIs3DBuildingsVisible(!is3DBuildingsVisible)}
        onResetView={() => mapRef.current?.resetView()}
        onLocate={() => mapRef.current?.locate()}
      />

      <AnimatePresence>
        {selectedRecord && (
          <SidePanel
            key="side-panel" // Key is important for AnimatePresence
            selectedRecord={selectedRecord}
            onClose={handleClosePanel}
          />
        )}
      </AnimatePresence>

      <Tutorial visible={showTutorial} onDismiss={handleTutorialDismiss} />
      <Toaster position="bottom-center" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="kala-ghoda-theme">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
