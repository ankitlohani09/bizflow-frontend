/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const [branding, setBranding] = useState(() => {
        const saved = localStorage.getItem('branding');
        return saved ? JSON.parse(saved) : {
            primaryColor: '#3b82f6',
            companyName: 'BizFlow',
            logoUrl: null
        };
    });

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
    const updateBranding = (newBranding) => setBranding(prev => ({ ...prev, ...newBranding }));

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, branding, updateBranding }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
