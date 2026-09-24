import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Logo from "../../components/common/Logo"
import { apiUrl } from "../../api/apiUrl"
import { useAuth } from "../../context/AuthContext"
import ThemeToggle from "../../components/common/ThemeToggle"

const API_URL = apiUrl("/auth")

const ROLES = [
    { label: "Customer", value: "user",        icon: "🛒", desc: "Browse & shop" },
    { label: "Seller",   value: "seller",      icon: "🏪", desc: "Manage store"  },
    { label: "Delivery", value: "deliveryBoy", icon: "🚚", desc: "Deliver orders" }
]

const FEATURES = [
    { icon: "🛍️", title: "Multi-vendor shopping", desc: "Discover thousands of products from verified sellers." },
    { icon: "⚡", title: "Instant checkout",       desc: "Smart cart with address detection and quick payments." },
    { icon: "📦", title: "Live order tracking",   desc: "Track every order from dispatch to doorstep in real time." },
]

function Login() {
    const navigate = useNavigate()
    const { login, user, loading: authLoading } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [isError, setIsError] = useState(false)

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        mobile: "",
        role: "user"
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value })
    }

    useEffect(() => {
        if (authLoading || !user) return

        if (user.role === "seller")      navigate("/seller/dashboard",       { replace: true })
        else if (user.role === "deliveryBoy") navigate("/delivery-boy/dashboard", { replace: true })
        else if (user.role === "admin")  navigate("/admin/dashboard",        { replace: true })
        else navigate("/", { replace: true })
    }, [authLoading, navigate, user])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")
        setIsError(false)

        try {
            const endpoint = isSignUp ? `${API_URL}/signup` : `${API_URL}/signin`
            const body = isSignUp
                ? formData
                : { email: formData.email, password: formData.password }

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            })

            const data = await res.json()

            if (!res.ok) {
                setIsError(true)
                setMessage(data.message || "Something went wrong")
                return
            }

            login(data.user, data.token)
            setMessage(data.message || "Success!")

            if (data.user.role === "seller")      navigate("/seller/dashboard",       { replace: true })
            else if (data.user.role === "deliveryBoy") navigate("/delivery-boy/dashboard", { replace: true })
            else if (data.user.role === "admin")  navigate("/admin/dashboard",        { replace: true })
            else navigate("/", { replace: true })
        } catch {
            setIsError(true)
            setMessage("Server error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="ss-auth-shell min-h-screen flex items-center justify-center px-4 py-12">
            <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
            {/* Floating background orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div style={{ position:"absolute", top:"10%", left:"5%", width:320, height:320, borderRadius:"50%", background:"rgba(99,102,241,.07)", filter:"blur(60px)" }} />
                <div style={{ position:"absolute", bottom:"15%", right:"8%", width:280, height:280, borderRadius:"50%", background:"rgba(139,92,246,.09)", filter:"blur(50px)" }} />
            </div>

            <div
                className="ss-auth-card relative w-full max-w-5xl overflow-hidden ss-scale-in"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    borderRadius: 28,
                    boxShadow: "0 32px 96px rgba(99,102,241,.22), 0 8px 32px rgba(0,0,0,.08)",
                    border: "1px solid rgba(255,255,255,.7)",
                    background: "var(--surface-card)"
                }}
            >
                {/* ── Left brand panel ── */}
                <div
                    className="hidden lg:flex flex-col justify-between p-10 text-white relative overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)" }}
                >
                    {/* Noise/mesh overlay */}
                    <div style={{ position:"absolute", inset:0, background:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E\")", opacity:.5 }} />

                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <Logo size={12} />
                            <div>
                                <h2 className="text-2xl font-800 tracking-tight">ShopSphere</h2>
                                <p className="text-sm text-indigo-200 font-500">Multi-vendor marketplace</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative space-y-8">
                        <div>
                            <h3 className="text-3xl font-800 leading-tight mb-3">
                                {isSignUp
                                    ? "Join the marketplace revolution"
                                    : "Welcome back to your storefront"}
                            </h3>
                            <p className="text-indigo-200 text-sm leading-relaxed max-w-xs">
                                Manage products, stores, deliveries, and customer experiences from one elegant commerce workspace.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="flex items-start gap-3">
                                    <span
                                        className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-lg"
                                        style={{ background: "rgba(255,255,255,.15)" }}
                                    >
                                        {f.icon}
                                    </span>
                                    <div>
                                        <p className="font-700 text-sm">{f.title}</p>
                                        <p className="text-indigo-200 text-xs mt-0.5">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex gap-2">
                        {["Seller", "Buyer", "Delivery"].map((r) => (
                            <span
                                key={r}
                                className="text-xs font-700 uppercase tracking-[.18em] px-3 py-1.5 rounded-full"
                                style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.22)" }}
                            >
                                {r}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── Right form panel ── */}
                <div className="w-full p-8 md:p-10 flex flex-col justify-center">
                    {/* Mobile logo */}
                    <div className="flex justify-center mb-6 lg:hidden">
                        <Logo />
                    </div>

                    {/* Tab toggle */}
                    <div className="mb-7 rounded-2xl bg-slate-100 p-1 grid grid-cols-2 shadow-inner">
                        {[
                            { label: "Sign In", value: false },
                            { label: "Sign Up", value: true }
                        ].map((tab) => (
                            <button
                                key={tab.label}
                                type="button"
                                onClick={() => { setIsSignUp(tab.value); setMessage("") }}
                                className={`rounded-xl py-2.5 text-sm font-700 transition-all duration-200 ${
                                    isSignUp === tab.value
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <h1 className="text-2xl font-800 tracking-tight text-slate-900">
                            {isSignUp ? "Create account" : "Welcome back"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isSignUp ? "Join thousands of buyers and sellers" : "Your modern commerce hub"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="ss-label">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="ss-input"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}

                        <div>
                            <label className="ss-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="ss-input"
                                placeholder="you@example.com"
                            />
                        </div>

                        {isSignUp && (
                            <div>
                                <label className="ss-label">Mobile Number</label>
                                <input
                                    type="text"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    required
                                    className="ss-input"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        )}

                        <div>
                            <label className="ss-label">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="ss-input"
                                placeholder="••••••••"
                            />
                        </div>

                        {isSignUp && (
                            <div>
                                <label className="ss-label">I am a…</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {ROLES.map((role) => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: role.value })}
                                            className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-700 transition-all duration-200 ${
                                                formData.role === role.value
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                                            }`}
                                        >
                                            <span className="text-xl">{role.icon}</span>
                                            <span>{role.label}</span>
                                            <span className="text-[9px] font-500 opacity-70">{role.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {message && (
                            <div
                                className={`rounded-xl px-4 py-3 text-sm font-600 flex items-center gap-2 ${
                                    isError
                                        ? "bg-red-50 text-red-700 border border-red-100"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}
                            >
                                <span>{isError ? "⚠️" : "✅"}</span>
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="ss-btn-primary w-full py-3 text-sm mt-2"
                        >
                            {loading ? (
                                <>
                                    <span className="ss-spinner" />
                                    Please wait…
                                </>
                            ) : isSignUp ? "Create account →" : "Sign in →"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login
