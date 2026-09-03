import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import MainLayout from "../../layouts/MainLayout"
import { apiUrl } from "../../api/apiUrl"

const STAT_CARDS = [
    {
        key: "totalProducts",
        label: "Total Products",
        icon: "📦",
        gradient: "ss-stat-gradient-violet",
        link: "/seller/products",
        linkLabel: "Manage Products →"
    },
    {
        key: "totalOrders",
        label: "Total Orders",
        icon: "🛍️",
        gradient: "ss-stat-gradient-blue",
        link: "/seller/orders",
        linkLabel: "View Orders →"
    },
    {
        key: "pendingOrders",
        label: "Pending Orders",
        icon: "🕐",
        gradient: "ss-stat-gradient-amber",
        link: "/seller/orders",
        linkLabel: "Review →"
    },
    {
        key: "deliveredOrders",
        label: "Delivered",
        icon: "✅",
        gradient: "ss-stat-gradient-emerald",
        link: "/seller/orders",
        linkLabel: "History →"
    }
]

const QUICK_ACTIONS = [
    { to: "/seller/products", icon: "➕", label: "Add Product",   desc: "List a new product in your store" },
    { to: "/seller/orders",   icon: "📋", label: "View Orders",   desc: "Manage incoming customer orders" },
    { to: "/seller/store",    icon: "🏪", label: "Edit Store",    desc: "Update your store profile & info" },
    { to: "/seller/dispatch", icon: "🚚", label: "Dispatch",      desc: "Assign orders to delivery partners" }
]

function SellerDashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch(apiUrl("/seller/dashboard"), { method: "GET", credentials: "include" })
                const data = await res.json()
                if (!res.ok) { setError(data.message || "Failed to fetch dashboard"); return }
                setStats(data)
            } catch { setError("Server error") }
            finally { setLoading(false) }
        }
        fetchDashboard()
    }, [])

    if (loading) {
        return (
            <MainLayout>
                <div className="mb-7">
                    <div className="ss-skeleton h-7 w-48 mb-2 rounded-xl" />
                    <div className="ss-skeleton h-4 w-72 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="ss-skeleton h-36 rounded-2xl" />)}
                </div>
                <div className="ss-skeleton h-28 rounded-2xl" />
            </MainLayout>
        )
    }

    if (error) {
        return (
            <MainLayout>
                <div className="ss-card p-8 text-center">
                    <p className="text-4xl mb-3">⚠️</p>
                    <p className="font-600 text-red-600">{error}</p>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-800 tracking-tight text-slate-900">Seller Dashboard</h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Manage your store, products, orders, and dispatch activity.
                    </p>
                </div>
                <Link to="/seller/products" className="ss-btn-primary !text-xs self-start sm:self-auto">
                    ➕ Add Product
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {STAT_CARDS.map((card) => (
                    <Link
                        key={card.key}
                        to={card.link}
                        className="relative overflow-hidden rounded-2xl p-5 text-white no-underline block group transition-transform duration-200 hover:-translate-y-1"
                        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.15)", textDecoration: "none" }}
                    >
                        <div className={`absolute inset-0 ${card.gradient}`} />
                        {/* Glow orb */}
                        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/10" />
                        <div className="relative">
                            <span className="text-3xl">{card.icon}</span>
                            <p className="mt-3 text-3xl font-800 text-white leading-none">
                                {stats?.[card.key] ?? 0}
                            </p>
                            <p className="mt-1 text-xs font-600 text-white/80 uppercase tracking-wider">{card.label}</p>
                            <p className="mt-3 text-[10px] font-700 text-white/70 group-hover:text-white transition-colors">{card.linkLabel}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Revenue card */}
            <div
                className="relative overflow-hidden rounded-2xl p-6 text-white mb-8"
                style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #1e1b4b 50%, #312e81 100%)", boxShadow: "0 12px 40px rgba(99,102,241,.3)" }}
            >
                <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-indigo-500/20" />
                <div className="absolute top-4 right-28 h-20 w-20 rounded-full bg-violet-500/15" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">💰</span>
                        <p className="text-sm font-600 text-indigo-300 uppercase tracking-wider">Total Revenue</p>
                    </div>
                    <p className="text-5xl font-800 tracking-tight text-white">
                        ₹{stats?.totalSales ?? 0}
                    </p>
                    <p className="text-indigo-300 text-sm mt-2">Lifetime earnings from your store</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="ss-section-title mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action) => (
                        <Link
                            key={action.to}
                            to={action.to}
                            className="ss-card p-5 flex flex-col gap-3 no-underline group"
                            style={{ textDecoration: "none" }}
                        >
                            <span
                                className="h-11 w-11 rounded-2xl flex items-center justify-center text-xl"
                                style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)" }}
                            >
                                {action.icon}
                            </span>
                            <div>
                                <p className="font-700 text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{action.label}</p>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{action.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </MainLayout>
    )
}

export default SellerDashboard