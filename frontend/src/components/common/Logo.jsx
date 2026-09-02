function Logo({ size = 9 }) {
    const sizeClass = size === 12 ? "h-12 w-12 text-lg" : "h-9 w-9"

    return (
        <div
            className={`${sizeClass} rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 shadow-lg shadow-indigo-500/25 flex items-center justify-center text-white font-black tracking-tight`}
            aria-label="ShopSphere logo"
        >
            S
        </div>
    )
}

export default Logo
