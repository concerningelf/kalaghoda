import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG, CHAPTERS } from '../data/config';
import { getCategories, parseYear } from '../utils/helpers';
import { useTheme } from './theme-provider';

const CLUSTER_ZOOM_THRESHOLD = 16;
const DARK_STYLE = "https://api.maptiler.com/maps/019b9cbc-2b55-70b4-b89b-4b390bcfb112/style.json?key=f0f0aibL2C05fTzSrqHq";

const Map = forwardRef(({
    selectedRecord,
    onSelectRecord,
    currentYear,
    disabledCategories,
    is1883Mode,
    isFortWallVisible,
    is3DBuildingsVisible,
    onMapLoad
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef({});
    const clusterHandlersRef = useRef({ click: null, mouseenter: null, mouseleave: null });
    const [isLoaded, setIsLoaded] = useState(false);
    const [floatingPoint, setFloatingPoint] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { theme } = useTheme();

    // Use a ref to store the current values for setupLayers to avoid stale closures
    const stateRef = useRef({
        is1883Mode,
        disabledCategories,
        currentYear,
        isFortWallVisible,
        is3DBuildingsVisible,
        theme
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        stateRef.current = {
            is1883Mode,
            disabledCategories,
            currentYear,
            isFortWallVisible,
            is3DBuildingsVisible,
            theme
        };
    }, [is1883Mode, disabledCategories, currentYear, isFortWallVisible, is3DBuildingsVisible, theme]);

    useImperativeHandle(ref, () => ({
        zoomIn: () => map.current?.zoomIn(),
        zoomOut: () => map.current?.zoomOut(),
        resetNorth: () => map.current?.resetNorth(),
        resetView: () => {
            map.current?.flyTo({
                center: MAP_CONFIG.startCenter,
                zoom: MAP_CONFIG.initialZoom,
                pitch: 45,
                bearing: -15,
                duration: 1000
            });
        },
        flyTo: (center, zoom) => map.current?.flyTo({ center, zoom: zoom || map.current.getZoom(), duration: 1000 }),
        locate: () => {
            navigator.geolocation.getCurrentPosition(pos => {
                map.current?.flyTo({
                    center: [pos.coords.longitude, pos.coords.latitude],
                    zoom: 17,
                    duration: 1000
                });
            });
        }
    }));

    // setupLayers should be stable so it doesn't trigger map re-init
    const setupLayers = useCallback(() => {
        if (!map.current) return;
        const { is1883Mode, disabledCategories, currentYear, isFortWallVisible, is3DBuildingsVisible, theme } = stateRef.current;

        // Cleanup existing if they exist (to avoid duplicates on style change)
        if (map.current.getLayer('layer-1883')) map.current.removeLayer('layer-1883');
        if (map.current.getSource('source-1883')) map.current.removeSource('source-1883');
        if (map.current.getLayer('3d-buildings')) map.current.removeLayer('3d-buildings');
        if (map.current.getLayer('fort-wall-layer')) map.current.removeLayer('fort-wall-layer');
        if (map.current.getSource('fort-wall')) map.current.removeSource('fort-wall');
        if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
        if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
        if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
        if (map.current.getSource('heritage-clusters')) map.current.removeSource('heritage-clusters');

        // Add Sources and Layers
        map.current.addSource('source-1883', {
            type: 'image',
            url: import.meta.env.BASE_URL === '/' ? '/images/fort-1883.jpg' : `${import.meta.env.BASE_URL}images/fort-1883.jpg`,
            coordinates: [[72.8228, 18.9435], [72.8492, 18.9435], [72.8492, 18.9235], [72.8228, 18.9235]]
        });
        map.current.addLayer({
            id: 'layer-1883',
            type: 'raster',
            source: 'source-1883',
            paint: { 'raster-fade-duration': 0 },
            layout: { visibility: is1883Mode ? 'visible' : 'none' }
        });

        // Only add 3D buildings if the source exists
        if (map.current.getSource('openmaptiles')) {
            map.current.addLayer({
                id: '3d-buildings',
                source: 'openmaptiles',
                'source-layer': 'building',
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': theme === 'dark' ? '#222' : '#f0f0f0',
                    'fill-extrusion-height': ['get', 'render_height'],
                    'fill-extrusion-base': ['get', 'render_min_height'],
                    'fill-extrusion-opacity': theme === 'dark' ? 0.6 : 0.9
                },
                layout: {
                    visibility: is3DBuildingsVisible && !is1883Mode ? 'visible' : 'none'
                }
            });
        }

        const fortWallGeoJSON = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: [[72.8312, 18.9278], [72.8318, 18.9276], [72.8325, 18.9273], [72.8335, 18.9268], [72.8342, 18.9265]]
            }
        };
        map.current.addSource('fort-wall', { type: 'geojson', data: fortWallGeoJSON });
        map.current.addLayer({
            id: 'fort-wall-layer',
            type: 'line',
            source: 'fort-wall',
            layout: { 'line-join': 'round', 'line-cap': 'round', visibility: isFortWallVisible ? 'visible' : 'none' },
            paint: { 'line-color': '#c0392b', 'line-width': 4, 'line-dasharray': [2, 4] }
        });

        // Calculate current filtered features for the source
        const filteredFeatures = is1883Mode ? [] : CHAPTERS.filter(record => {
            const categories = getCategories(record);
            const isCategoryVisible = categories.some(cat => !disabledCategories.includes(cat));
            const isYearVisible = parseYear(record.year) <= currentYear;
            return isCategoryVisible && isYearVisible;
        }).map(record => {
            const categories = getCategories(record);
            const primaryCategory = categories[0];
            return {
                type: 'Feature',
                properties: {
                    id: record.id,
                    title: record.title,
                    category: primaryCategory,
                    color: MAP_CONFIG.colors[primaryCategory] || '#333'
                },
                geometry: {
                    type: 'Point',
                    coordinates: record.location.center
                }
            };
        });

        // Clustering Source
        map.current.addSource('heritage-clusters', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: filteredFeatures },
            cluster: true,
            clusterMaxZoom: CLUSTER_ZOOM_THRESHOLD,
            clusterRadius: 50
        });

        map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'heritage-clusters',
            filter: ['!', ['has', 'point_count']],
            maxzoom: CLUSTER_ZOOM_THRESHOLD,
            paint: {
                'circle-color': ['get', 'color'],
                'circle-radius': 10, // Slightly larger for visibility
                'circle-stroke-width': 2,
                'circle-stroke-color': theme === 'dark' ? '#111' : '#fff',
                'circle-opacity': 1,
                'circle-stroke-opacity': 1
            },
            layout: { visibility: is1883Mode ? 'none' : 'visible' }
        });

        map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'heritage-clusters',
            filter: ['has', 'point_count'],
            maxzoom: CLUSTER_ZOOM_THRESHOLD,
            paint: {
                'circle-color': ['step', ['get', 'point_count'], '#2980b9', 10, '#8e44ad', 25, '#c0392b'],
                'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 25, 30],
                'circle-stroke-width': 3,
                'circle-stroke-color': theme === 'dark' ? '#111' : '#fff',
                'circle-opacity': 1,
                'circle-stroke-opacity': 1
            },
            layout: { visibility: is1883Mode ? 'none' : 'visible' }
        });

        map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'heritage-clusters',
            filter: ['has', 'point_count'],
            maxzoom: CLUSTER_ZOOM_THRESHOLD,
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': 12,
                visibility: is1883Mode ? 'none' : 'visible'
            },
            paint: { 'text-color': '#ffffff' }
        });

        // Remove old cluster event handlers before adding new ones
        if (clusterHandlersRef.current.click) {
            map.current.off('click', 'clusters', clusterHandlersRef.current.click);
        }
        if (clusterHandlersRef.current.mouseenter) {
            map.current.off('mouseenter', 'clusters', clusterHandlersRef.current.mouseenter);
        }
        if (clusterHandlersRef.current.mouseleave) {
            map.current.off('mouseleave', 'clusters', clusterHandlersRef.current.mouseleave);
        }

        // Define new handlers
        const handleClusterClick = async (e) => {
            const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            if (!features.length) return;
            const clusterId = features[0].properties.cluster_id;
            const coordinates = features[0].geometry.coordinates.slice();
            const clusterSource = map.current.getSource('heritage-clusters');
            if (clusterSource) {
                const zoom = await clusterSource.getClusterExpansionZoom(clusterId);
                map.current.flyTo({ center: coordinates, zoom: Math.min(zoom + 0.5, 18), duration: 500 });
            }
        };
        const handleClusterMouseEnter = () => { if (map.current) map.current.getCanvas().style.cursor = 'pointer'; };
        const handleClusterMouseLeave = () => { if (map.current) map.current.getCanvas().style.cursor = ''; };

        // Store refs and add new handlers
        clusterHandlersRef.current = { click: handleClusterClick, mouseenter: handleClusterMouseEnter, mouseleave: handleClusterMouseLeave };
        map.current.on('click', 'clusters', handleClusterClick);
        map.current.on('mouseenter', 'clusters', handleClusterMouseEnter);
        map.current.on('mouseleave', 'clusters', handleClusterMouseLeave);

        // Ensure cluster layers are at the top
        if (map.current.getLayer('unclustered-point')) map.current.moveLayer('unclustered-point');
        if (map.current.getLayer('clusters')) map.current.moveLayer('clusters');
        if (map.current.getLayer('cluster-count')) map.current.moveLayer('cluster-count');
    }, []);

    // Initialize Map - only runs once
    useEffect(() => {
        if (map.current) return;

        const defaultBottomPadding = window.innerWidth < 768 ? 0 : 300;
        const mapPadding = { top: 0, bottom: defaultBottomPadding, left: 0, right: 0 };

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: theme === 'dark' ? DARK_STYLE : MAP_CONFIG.style,
            center: MAP_CONFIG.startCenter,
            zoom: MAP_CONFIG.initialZoom,
            minZoom: 14.5,
            maxBounds: [[72.8100, 18.9100], [72.8500, 18.9450]],
            pitch: 45,
            bearing: -15,
            antialias: true,
            attributionControl: false,
            padding: mapPadding
        });

        map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
        map.current.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

        map.current.on('load', () => {
            setupLayers();
            // Create DOM markers
            CHAPTERS.forEach(record => {
                const categories = getCategories(record);
                const primaryCategory = categories[0];
                const color = MAP_CONFIG.colors[primaryCategory] || '#333';
                const icon = MAP_CONFIG.icons[primaryCategory] || 'fa-location-dot';
                const isMultiCategory = categories.length > 1;

                const el = document.createElement('div');
                el.className = 'marker' + (isMultiCategory ? ' marker-multi' : '');
                el.style.backgroundColor = color;
                el.style.display = 'none';
                el.innerHTML = `<i class="fa-solid ${icon}"></i>`;

                if (isMultiCategory) {
                    const secondaryCategory = categories[1];
                    const secondaryColor = MAP_CONFIG.colors[secondaryCategory] || '#333';
                    el.style.setProperty('--ring-color', secondaryColor);
                }

                el.addEventListener('click', () => onSelectRecord(record));
                const marker = new maplibregl.Marker({ element: el }).setLngLat(record.location.center).addTo(map.current);
                markersRef.current[record.id] = { marker, element: el, record, categories };
            });
            setIsLoaded(true);
            onMapLoad?.();
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [onSelectRecord, setupLayers]);

    // Update Data & Visibilities
    useEffect(() => {
        if (!map.current || !isLoaded) return;

        const currentZoom = map.current.getZoom();
        const showMarkersBasedOnZoom = currentZoom >= CLUSTER_ZOOM_THRESHOLD;

        // 1. Update DOM Markers
        if (is1883Mode) {
            Object.values(markersRef.current).forEach(({ element }) => { element.style.display = 'none'; });
        } else {
            Object.values(markersRef.current).forEach(({ element, categories, record }) => {
                const isCategoryVisible = categories.some(cat => !disabledCategories.includes(cat));
                const isYearVisible = parseYear(record.year) <= currentYear;
                const isSelected = selectedRecord?.id === record.id;
                const isFloatingOnDesktop = isSelected && !isMobile;
                if (isSelected) element.classList.add('selected'); else element.classList.remove('selected');

                if (!isFloatingOnDesktop && (showMarkersBasedOnZoom || isSelected) && isCategoryVisible && isYearVisible) {
                    element.style.display = 'flex';
                    element.style.opacity = '1';
                } else {
                    element.style.display = 'none';
                }
            });
        }

        // 2. Update Cluster Source
        const filteredFeatures = is1883Mode ? [] : CHAPTERS.filter(record => {
            const categories = getCategories(record);
            const isCategoryVisible = categories.some(cat => !disabledCategories.includes(cat));
            const isYearVisible = parseYear(record.year) <= currentYear;
            return isCategoryVisible && isYearVisible;
        }).map(record => {
            const categories = getCategories(record);
            const primaryCategory = categories[0];
            return {
                type: 'Feature',
                properties: { id: record.id, title: record.title, category: primaryCategory, color: MAP_CONFIG.colors[primaryCategory] || '#333' },
                geometry: { type: 'Point', coordinates: record.location.center }
            };
        });

        const source = map.current.getSource('heritage-clusters');
        if (source && map.current.isStyleLoaded()) {
            source.setData({ type: 'FeatureCollection', features: filteredFeatures });
        }

        // 3. Update Layer Visibilities
        if (map.current.getLayer('layer-1883')) {
            map.current.setLayoutProperty('layer-1883', 'visibility', is1883Mode ? 'visible' : 'none');
            if (is1883Mode) map.current.moveLayer('layer-1883');
        }
        if (map.current.getLayer('fort-wall-layer')) map.current.setLayoutProperty('fort-wall-layer', 'visibility', isFortWallVisible ? 'visible' : 'none');
        if (map.current.getLayer('3d-buildings')) map.current.setLayoutProperty('3d-buildings', 'visibility', is3DBuildingsVisible && !is1883Mode ? 'visible' : 'none');
        if (map.current.getLayer('unclustered-point')) map.current.setLayoutProperty('unclustered-point', 'visibility', is1883Mode ? 'none' : 'visible');
        if (map.current.getLayer('clusters')) map.current.setLayoutProperty('clusters', 'visibility', is1883Mode ? 'none' : 'visible');
        if (map.current.getLayer('cluster-count')) map.current.setLayoutProperty('cluster-count', 'visibility', is1883Mode ? 'none' : 'visible');

    }, [currentYear, disabledCategories, is1883Mode, isFortWallVisible, is3DBuildingsVisible, selectedRecord, isLoaded, theme]);

    // Theme Change - simplified to just set style, existing handlers will rebuild layers
    const prevTheme = useRef(theme);
    useEffect(() => {
        if (!map.current || !isLoaded) return;
        // Only run if theme actually changed (not on initial mount)
        if (prevTheme.current === theme) return;
        prevTheme.current = theme;

        const newStyle = theme === 'dark' ? DARK_STYLE : MAP_CONFIG.style;
        map.current.setStyle(newStyle);

        const onStyleData = () => {
            if (map.current.isStyleLoaded()) {
                setupLayers();
                map.current.off('styledata', onStyleData);
            }
        };
        map.current.on('styledata', onStyleData);

        return () => {
            if (map.current) map.current.off('styledata', onStyleData);
        };
    }, [theme, isLoaded, setupLayers]);

    // Mode Transitions
    const prevIs1883Mode = useRef(is1883Mode);
    useEffect(() => {
        if (!map.current || !isLoaded) return;
        if (is1883Mode && !prevIs1883Mode.current) {
            map.current.fitBounds([[72.8228, 18.9235], [72.8492, 18.9435]], { padding: 100, pitch: 0, bearing: 0 });
        }
        prevIs1883Mode.current = is1883Mode;
    }, [is1883Mode, isLoaded]);

    const prevIsFortWallVisible = useRef(isFortWallVisible);
    useEffect(() => {
        if (!map.current || !isLoaded) return;
        if (isFortWallVisible && !prevIsFortWallVisible.current) {
            map.current.fitBounds([[72.8312, 18.9265], [72.8342, 18.9278]], { padding: 150, pitch: 45, bearing: -15, duration: 2000 });
        }
        prevIsFortWallVisible.current = isFortWallVisible;
    }, [isFortWallVisible, isLoaded]);

    useEffect(() => {
        if (!map.current || !isLoaded || is1883Mode) return;
        map.current.easeTo({ pitch: is3DBuildingsVisible ? 45 : 0, duration: 1000 });
    }, [is3DBuildingsVisible, is1883Mode, isLoaded]);

    // Zoom Handling
    useEffect(() => {
        if (!map.current || !isLoaded) return;
        const handleZoom = () => {
            if (is1883Mode) return;
            const show = map.current.getZoom() >= CLUSTER_ZOOM_THRESHOLD;
            Object.values(markersRef.current).forEach(({ element, categories, record }) => {
                const isSelected = selectedRecord?.id === record.id;
                const isFloatingOnDesktop = isSelected && !isMobile;
                const visible = !isFloatingOnDesktop && (show || isSelected) && categories.some(cat => !disabledCategories.includes(cat)) && parseYear(record.year) <= currentYear;
                element.style.display = visible ? 'flex' : 'none';
                if (isSelected) element.classList.add('selected'); else element.classList.remove('selected');
            });
        };
        map.current.on('zoom', handleZoom);
        return () => { if (map.current) map.current.off('zoom', handleZoom); };
    }, [isLoaded, disabledCategories, currentYear, selectedRecord, is1883Mode]);

    // Floating Focused Marker Sync (Desktop Only)
    useEffect(() => {
        if (!map.current || !selectedRecord || isMobile || !isLoaded) {
            setFloatingPoint(null);
            return;
        }

        const updatePosition = () => {
            if (!map.current || !selectedRecord) return;
            const point = map.current.project(selectedRecord.location.center);
            setFloatingPoint({ x: point.x, y: point.y });
        };

        updatePosition();
        map.current.on('move', updatePosition);
        map.current.on('zoom', updatePosition);
        map.current.on('rotate', updatePosition);
        map.current.on('pitch', updatePosition);

        return () => {
            if (map.current) {
                map.current.off('move', updatePosition);
                map.current.off('zoom', updatePosition);
                map.current.off('rotate', updatePosition);
                map.current.off('pitch', updatePosition);
            }
        };
    }, [selectedRecord, isMobile, isLoaded]);

    return (
        <>
            <div className="map-wrapper" style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1 }}>
                <div ref={mapContainer} id="map" style={{ width: '100%', height: '100%' }} />
            </div>

            {/* Floating Marker for Desktop - sits ABOVE the map-wrapper's z-index context */}
            {floatingPoint && selectedRecord && !isMobile && (
                <div
                    className="floating-focused-marker"
                    style={{
                        left: floatingPoint.x,
                        top: floatingPoint.y,
                        backgroundColor: (MAP_CONFIG.colors[getCategories(selectedRecord)[0]] || '#333'),
                        position: 'fixed', // Force fixed to escape any relative parents
                        zIndex: 2000
                    }}
                >
                    <i className={`fa-solid ${MAP_CONFIG.icons[getCategories(selectedRecord)[0]] || 'fa-location-dot'}`}></i>
                </div>
            )}
        </>
    );
});

export default Map;
