import React from 'react';
import { CHAPTERS } from '../data/config';

const MapPlaceholder = ({ onSelectRecord }) => {
    return (
        <div className="map-placeholder" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#e0e0e0',
            zIndex: 1
        }}>
            <h2 style={{ fontFamily: 'Labrada, serif', fontSize: '32px', color: '#cfa842' }}>Map Placeholder</h2>
            <p style={{ fontFamily: 'Lato, sans-serif', color: '#666', marginBottom: '20px' }}>
                Click a site to test the <strong>Side Panel</strong>:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '20px', maxWidth: '800px', justifyContent: 'center' }}>
                {CHAPTERS.slice(0, 15).map(chapter => (
                    <button
                        key={chapter.id}
                        onClick={() => onSelectRecord(chapter)}
                        className="panel-action-btn secondary"
                        style={{ padding: '8px 16px', height: 'auto', width: 'auto' }}
                    >
                        {chapter.title}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MapPlaceholder;
