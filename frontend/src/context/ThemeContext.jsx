/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react"

const ThemeContext = createContext(null)
const STORAGE_KEY = "shopsphere-theme"

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark")
        document.documentElement.style.colorScheme = theme
        localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    const value = useMemo(() => ({
        theme,
        isDark: theme === "dark",
        toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark")
    }), [theme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error("useTheme must be used within a ThemeProvider")
    return context
}
