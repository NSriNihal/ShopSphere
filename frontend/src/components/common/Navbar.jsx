import { Link, useNavigate } from "react-router-dom"
import Logo from "./Logo"
import { useAuth } from "../../context/AuthContext"

function Navbar() {
    const navigate = useNavigate()
    const { user, logout } = useAuth()

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

    return (
        <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                <Link to={getDashboardLink()} className="flex items-center gap-3">
                    <Logo />
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">
                            ShopSphere
                        </h1>
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                            Marketplace
                        </p>
                    </div>
                </Link>

                {user && (
                    <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
                        {user.role === "user" && (
                            <>
                                <Link to="/" className="transition hover:text-indigo-600">
                                    Stores
                                </Link>
                                <Link to="/my-orders" className="transition hover:text-indigo-600">
                                    My Orders
                                </Link>
                                <Link to="/profile" className="transition hover:text-indigo-600">
                                    Profile
                                </Link>
                            </>
                        )}
                        {user.role === "seller" && (
                            <>
                                <Link to="/seller/dashboard" className="transition hover:text-indigo-600">
                                    Dashboard
                                </Link>
                                <Link to="/seller/store" className="transition hover:text-indigo-600">
                                    Store
                                </Link>
                                <Link to="/seller/products" className="transition hover:text-indigo-600">
                                    Products
                                </Link>
                                <Link to="/seller/orders" className="transition hover:text-indigo-600">
                                    Orders
                                </Link>
                                <Link to="/seller/dispatch" className="transition hover:text-indigo-600">
                                    Dispatch
                                </Link>
                            </>
                        )}

                        {user.role === "deliveryBoy" && (
                            <>
                                <Link to="/delivery-boy/dashboard" className="transition hover:text-indigo-600">
                                    Dashboard
                                </Link>
                                <Link to="/delivery-boy/orders" className="transition hover:text-indigo-600">
                                    Assigned Orders
                                </Link>
                                <Link to="/delivery-boy/earnings" className="transition hover:text-indigo-600">
                                    Earnings
                                </Link>
                            </>
                        )}

                        {user.role === "admin" && (
                            <>
                                <Link to="/admin/dashboard" className="transition hover:text-indigo-600">
                                    Dashboard
                                </Link>
                                <Link to="/admin/users" className="transition hover:text-indigo-600">
                                    Users
                                </Link>
                                <Link to="/admin/orders" className="transition hover:text-indigo-600">
                                    Orders
                                </Link>
                                <Link to="/admin/stores" className="transition hover:text-indigo-600">
                                    Stores
                                </Link>
                            </>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                                <p className="text-[11px] capitalize tracking-[0.16em] text-slate-500">
                                    {user.role}
                                </p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                            >
                                Logout
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </nav>
    )
}

export default Navbar