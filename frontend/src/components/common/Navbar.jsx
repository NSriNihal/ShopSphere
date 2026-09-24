import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import Logo from "./Logo"
import { useAuth } from "../../context/AuthContext"
import ThemeToggle from "./ThemeToggle"

function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate("/login")
    }

    const getDashboardLink = () => {
        if (!user) return "/login"
        if (user.role === "seller") return "/seller/dashboard"
        if (user.role === "deliveryBoy") return "/delivery-boy/dashboard"
        if (user.role === "admin") return "/admin/dashboard"
        return "/"
    }

    const isActive = (path) =>
        location.pathname === path ||
        (path !== "/" && location.pathname.startsWith(path))

    const navLinkCls = (path) =>
        `relative text-sm font-600 transition-colors duration-200 pb-0.5 ${
            isActive(path)
                ? "text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-500 after:rounded-full"
                : "text-slate-600 hover:text-indigo-600"
        }`

    const userInitials = user?.fullName
        ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "?"

    const gradientByRole = {
        seller: "from-violet-500 to-purple-600",
        deliveryBoy: "from-amber-500 to-orange-600",
        admin: "from-rose-500 to-pink-600",
        user: "from-indigo-500 to-blue-600"
    }
    const avatarGradient = gradientByRole[user?.role] || "from-indigo-500 to-blue-600"

    return (
        <nav className="ss-navbar sticky top-0 z-50 border-b backdrop-blur-2xl shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">

                {/* Logo */}
                <Link to={getDashboardLink()} className="flex items-center gap-2.5 group">
                    <Logo />
                    <div>
                        <h1 className="text-base font-800 tracking-tight text-slate-900 leading-none">
                            ShopSphere
                        </h1>
                        <p className="text-[10px] font-600 uppercase tracking-[.22em] text-slate-400 mt-0.5">
                            Marketplace
                        </p>
                    </div>
                </Link>

                {/* Desktop nav links */}
                {user && (
                    <div className="hidden items-center gap-7 md:flex">
                        {user.role === "user" && (
                            <>
                                <Link to="/" className={navLinkCls("/")}>Stores</Link>
                                <Link to="/my-orders" className={navLinkCls("/my-orders")}>My Orders</Link>
                                <Link to="/profile" className={navLinkCls("/profile")}>Profile</Link>
                            </>
                        )}
                        {user.role === "seller" && (
                            <>
                                <Link to="/seller/dashboard" className={navLinkCls("/seller/dashboard")}>Dashboard</Link>
                                <Link to="/seller/store" className={navLinkCls("/seller/store")}>Store</Link>
                                <Link to="/seller/products" className={navLinkCls("/seller/products")}>Products</Link>
                                <Link to="/seller/orders" className={navLinkCls("/seller/orders")}>Orders</Link>
                                <Link to="/seller/dispatch" className={navLinkCls("/seller/dispatch")}>Dispatch</Link>
                            </>
                        )}
                        {user.role === "deliveryBoy" && (
                            <>
                                <Link to="/delivery-boy/dashboard" className={navLinkCls("/delivery-boy/dashboard")}>Dashboard</Link>
                                <Link to="/delivery-boy/orders" className={navLinkCls("/delivery-boy/orders")}>Assigned Orders</Link>
                                <Link to="/delivery-boy/earnings" className={navLinkCls("/delivery-boy/earnings")}>Earnings</Link>
                            </>
                        )}
                        {user.role === "admin" && (
                            <>
                                <Link to="/admin/dashboard" className={navLinkCls("/admin/dashboard")}>Dashboard</Link>
                                <Link to="/admin/users" className={navLinkCls("/admin/users")}>Users</Link>
                                <Link to="/admin/orders" className={navLinkCls("/admin/orders")}>Orders</Link>
                                <Link to="/admin/stores" className={navLinkCls("/admin/stores")}>Stores</Link>
                            </>
                        )}
                    </div>
                )}

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <ThemeToggle compact />
                    {user ? (
                        <>
                            {/* User avatar */}
                            <div className="hidden sm:flex items-center gap-2.5">
                                <div
                                    className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-700 text-xs shadow-md`}
                                >
                                    {userInitials}
                                </div>
                                <div className="hidden lg:block">
                                    <p className="text-sm font-700 text-slate-900 leading-none">{user.fullName}</p>
                                    <p className="text-[10px] capitalize tracking-widest text-slate-400 mt-0.5">{user.role}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="ss-btn-secondary !py-2 !px-4 !text-xs"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="ss-btn-primary !py-2 !px-5 !text-xs">
                            Sign In
                        </Link>
                    )}

                    {/* Mobile hamburger */}
                    {user && (
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden flex flex-col gap-1.5 p-1.5"
                            aria-label="Toggle menu"
                        >
                            <span className={`block h-0.5 w-5 bg-slate-700 rounded transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                            <span className={`block h-0.5 w-5 bg-slate-700 rounded transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
                            <span className={`block h-0.5 w-5 bg-slate-700 rounded transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile menu */}
            {user && menuOpen && (
                <div className="md:hidden border-t border-white/50 bg-white/90 backdrop-blur-xl px-4 py-4 space-y-1 ss-slide-up">
                    {user.role === "user" && (
                        <>
                            <MobileLink to="/" label="🏪 Stores" onClick={() => setMenuOpen(false)} active={isActive("/")} />
                            <MobileLink to="/my-orders" label="📦 My Orders" onClick={() => setMenuOpen(false)} active={isActive("/my-orders")} />
                            <MobileLink to="/profile" label="👤 Profile" onClick={() => setMenuOpen(false)} active={isActive("/profile")} />
                        </>
                    )}
                    {user.role === "seller" && (
                        <>
                            <MobileLink to="/seller/dashboard" label="📊 Dashboard" onClick={() => setMenuOpen(false)} active={isActive("/seller/dashboard")} />
                            <MobileLink to="/seller/store" label="🏪 Store" onClick={() => setMenuOpen(false)} active={isActive("/seller/store")} />
                            <MobileLink to="/seller/products" label="📦 Products" onClick={() => setMenuOpen(false)} active={isActive("/seller/products")} />
                            <MobileLink to="/seller/orders" label="🛍️ Orders" onClick={() => setMenuOpen(false)} active={isActive("/seller/orders")} />
                            <MobileLink to="/seller/dispatch" label="🚚 Dispatch" onClick={() => setMenuOpen(false)} active={isActive("/seller/dispatch")} />
                        </>
                    )}
                    {user.role === "deliveryBoy" && (
                        <>
                            <MobileLink to="/delivery-boy/dashboard" label="📊 Dashboard" onClick={() => setMenuOpen(false)} active={isActive("/delivery-boy/dashboard")} />
                            <MobileLink to="/delivery-boy/orders" label="📦 Assigned Orders" onClick={() => setMenuOpen(false)} active={isActive("/delivery-boy/orders")} />
                            <MobileLink to="/delivery-boy/earnings" label="💰 Earnings" onClick={() => setMenuOpen(false)} active={isActive("/delivery-boy/earnings")} />
                        </>
                    )}
                </div>
            )}
        </nav>
    )
}

function MobileLink({ to, label, onClick, active }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-600 transition-colors ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
            }`}
        >
            {label}
        </Link>
    )
}

export default Navbar
