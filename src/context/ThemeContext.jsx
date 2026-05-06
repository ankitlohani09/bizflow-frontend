import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import brandingService from '../services/brandingService';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const [branding, setBranding] = useState({
        primaryColor: '#6366f1',
        companyName: 'BizFlow',
        logoUrl: null
    });

    const fetchInProgress = React.useRef(null);

    const fetchBranding = useCallback(async () => {
        // If already fetching, return the existing promise
        if (fetchInProgress.current) return fetchInProgress.current;

        fetchInProgress.current = (async () => {
            try {
                const data = await brandingService.getSettings();
                if (data) {
                    const newBranding = {
                        primaryColor: data.primaryColor || '#6366f1',
                        companyName: data.brandName || 'BizFlow',
                        logoUrl: data.logoUrl || null
                    };
                    setBranding(newBranding);
                    localStorage.setItem('branding', JSON.stringify(newBranding));
                }
            } catch (error) {
                console.error('Failed to fetch branding:', error);
                const saved = localStorage.getItem('branding');
                if (saved) setBranding(JSON.parse(saved));
            } finally {
                fetchInProgress.current = null;
            }
        })();

        return fetchInProgress.current;
    }, []);

    useEffect(() => {
        fetchBranding();
    }, [fetchBranding]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        document.documentElement.style.setProperty('--color-brand-primary', branding.primaryColor);
        localStorage.setItem('branding', JSON.stringify(branding));
    }, [branding]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);
    
    const updateBranding = async (newBranding) => {
        setBranding(prev => ({ ...prev, ...newBranding }));
        try {
            await brandingService.updateSettings({
                brandName: newBranding.companyName,
                primaryColor: newBranding.primaryColor,
                logoUrl: newBranding.logoUrl
            });
        } catch (error) {
            console.error('Failed to sync branding to backend:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, branding, updateBranding, refreshBranding: fetchBranding }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
