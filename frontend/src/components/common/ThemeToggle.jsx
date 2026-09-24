import { useTheme } from "../../context/ThemeContext"

function ThemeToggle({ compact = false }) {
    const { isDark, toggleTheme } = useTheme()
    const label = isDark ? "Switch to light theme" : "Switch to dark theme"

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`ss-theme-toggle ${compact ? "ss-theme-toggle-compact" : ""}`}
            aria-label={label}
            title={label}
        >
            <span className="ss-theme-toggle-icon" aria-hidden="true">{isDark ? "☀" : "☾"}</span>
            {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
        </button>
    )
}

export default ThemeToggle
