import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/common/Navbar"
import Logo from "../../components/common/Logo"
import { apiUrl } from "../../api/apiUrl"
import { useAuth } from "../../context/AuthContext"

const API_URL = apiUrl("/auth")

function Login() {
    const navigate = useNavigate()
    const { login, user, loading: authLoading } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

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
        if (authLoading || !user) {
            return
        }

        if (user.role === "seller") {
            navigate("/seller/dashboard", { replace: true })
            return
        }

        if (user.role === "deliveryBoy") {
            navigate("/delivery-boy/dashboard", { replace: true })
            return
        }

        if (user.role === "admin") {
            navigate("/admin/dashboard", { replace: true })
            return
        }

        navigate("/", { replace: true })
    }, [authLoading, navigate, user])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

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
                setMessage(data.message || "Something went wrong")
                return
            }

            login(data.user, data.token)

            setMessage(data.message || "Success")

            if (data.user.role === "seller") navigate("/seller/dashboard", { replace: true })
            else if (data.user.role === "deliveryBoy") navigate("/delivery-boy/dashboard", { replace: true })
            else if (data.user.role === "admin") navigate("/admin/dashboard", { replace: true })
            else navigate("/", { replace: true })
        } catch (error) {
            setMessage("Server error. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Navbar />

            <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-12">
                <div className="grid w-full max-w-5xl grid-cols-1 gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-[0_30px_80px_-30px_rgba(79,70,229,0.45)] backdrop-blur-xl lg:grid-cols-[1.1fr_1fr]">
                    <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 p-8 text-white lg:flex">
                        <div className="flex items-center gap-3">
                            <Logo size={12} />
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">ShopSphere</h2>
                                <p className="text-sm text-indigo-100">Multi-vendor marketplace</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 text-3xl font-semibold leading-tight">
                                {isSignUp ? "Create your marketplace account" : "Welcome back to your storefront"}
                            </h3>
                            <p className="max-w-sm text-sm text-indigo-100">
                                Manage products, stores, deliveries, and customer experiences from one elegant commerce workspace.
                            </p>
                        </div>

                        <div className="flex gap-3 text-xs uppercase tracking-[0.22em] text-indigo-100">
                            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Seller</span>
                            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Buyer</span>
                            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1">Delivery</span>
                        </div>
                    </div>

                    <div className="w-full p-7 md:p-10">
                        <div className="mb-7 text-center">
                            <div className="mx-auto flex justify-center">
                                <Logo />
                            </div>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                                {isSignUp ? "Create account" : "Welcome back"}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">Your modern commerce hub</p>
                        </div>

                        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(false)}
                                className={`rounded-xl py-2.5 text-sm font-semibold transition ${!isSignUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                            >
                                Sign In
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsSignUp(true)}
                                className={`rounded-xl py-2.5 text-sm font-semibold transition ${isSignUp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        placeholder="Enter full name"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    placeholder="Enter email"
                                />
                            </div>

                            {isSignUp && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Mobile</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                        placeholder="Enter mobile number"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                                    placeholder="Enter password"
                                />
                            </div>

                            {isSignUp && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Select Role</label>

                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: "User", value: "user" },
                                            { label: "Seller", value: "seller" },
                                            { label: "Delivery", value: "deliveryBoy" }
                                        ].map((role) => (
                                            <button
                                                key={role.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, role: role.value })}
                                                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${formData.role === role.value ? "border-indigo-500 bg-indigo-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-600"}`}
                                            >
                                                {role.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {message && <p className="text-sm font-medium text-amber-600">{message}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login
