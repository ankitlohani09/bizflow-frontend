import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import brandingService from '../services/brandingService';
import tenantService from '../services/tenantService';
import { getTimezone, setTimezone } from '../utils/formatDate';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const [branding, setBranding] = useState({
        primaryColor: '#6366f1',
        brandName: 'BizFlow',
        logoUrl: null
    });

    // Timezone: localStorage se initialize, default IST
    const [timezone, setTimezoneState] = useState(() => getTimezone());

    const fetchInProgress = React.useRef(null);

    const fetchSettings = useCallback(async () => {
        // If already fetching, return the existing promise
        if (fetchInProgress.current) return fetchInProgress.current;

        fetchInProgress.current = (async () => {
            try {
                // 1. Fetch Branding
                const data = await brandingService.getSettings();
                if (data) {
                    const newBranding = {
                        primaryColor: data.primaryColor || '#6366f1',
                        brandName: data.brandName || 'BizFlow',
                        logoUrl: data.logoUrl || null,
                        companyAddress: data.address || null
                    };
                    setBranding(newBranding);
                    localStorage.setItem('branding', JSON.stringify(newBranding));
                }

                // 2. Fetch Tenant Settings (including Timezone and Address)
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user.tenantId) {
                    const tenantData = await tenantService.getById(user.tenantId);
                    if (tenantData) {
                        if (tenantData.timezone) {
                            setTimezoneState(tenantData.timezone);
                            localStorage.setItem('app_timezone', tenantData.timezone);
                        }
                        if (tenantData.address) {
                            setBranding(prev => ({ ...prev, companyAddress: tenantData.address }));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                const saved = localStorage.getItem('branding');
                if (saved) setBranding(JSON.parse(saved));
            } finally {
                fetchInProgress.current = null;
            }
        })();

        return fetchInProgress.current;
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

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

    /** Owner timezone change karta hai — poora app instantly update hoga */
    const changeTimezone = (tz) => {
        setTimezone(tz);        // localStorage + event dispatch
        setTimezoneState(tz);   // context re-render trigger
    };
    
    const setBrandingPreview = (newBranding) => {
        setBranding(prev => ({ ...prev, ...newBranding }));
    };
    
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
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, branding, updateBranding, setBrandingPreview, refreshBranding: fetchSettings, timezone, changeTimezone }}>
            {children}
        </ThemeContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
    return useContext(ThemeContext);
}
