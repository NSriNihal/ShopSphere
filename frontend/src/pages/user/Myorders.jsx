import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import MainLayout from "../../layouts/MainLayout"
import { apiUrl } from "../../api/apiUrl"

const STATUS_CONFIG = {
    pending:    { badge: "ss-badge ss-badge-pending",    icon: "🕐", label: "Pending"   },
    accepted:   { badge: "ss-badge ss-badge-accepted",   icon: "✅", label: "Accepted"  },
    assigned:   { badge: "ss-badge ss-badge-assigned",   icon: "👤", label: "Assigned"  },
    dispatched: { badge: "ss-badge ss-badge-dispatched", icon: "🚚", label: "Dispatched" },
    delivered:  { badge: "ss-badge ss-badge-delivered",  icon: "🎉", label: "Delivered" },
    cancelled:  { badge: "ss-badge ss-badge-cancelled",  icon: "❌", label: "Cancelled" }
}

const ORDER_STEPS = ["pending", "accepted", "assigned", "dispatched", "delivered"]

function StatusTimeline({ currentStatus }) {
    const idx = ORDER_STEPS.indexOf(currentStatus)
    if (currentStatus === "cancelled") {
        return (
            <div className="flex items-center gap-2 mt-3">
                <span className="ss-badge ss-badge-cancelled">❌ Order Cancelled</span>
            </div>
        )
    }
    return (
        <div className="mt-4 flex items-center gap-1 overflow-x-auto">
            {ORDER_STEPS.map((step, i) => {
                const done = i <= idx
                const active = i === idx
                return (
                    <div key={step} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-700 transition-all duration-300"
                                style={done
                                    ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", boxShadow: active ? "0 0 0 3px rgba(99,102,241,.3)" : "none" }
                                    : { background: "#e2e8f0", color: "#94a3b8" }
                                }
                            >
                                {done ? "✓" : i + 1}
                            </div>
                            <span className="text-[9px] font-600 capitalize whitespace-nowrap" style={{ color: done ? "#6366f1" : "#94a3b8" }}>
                                {step}
                            </span>
                        </div>
                        {i < ORDER_STEPS.length - 1 && (
                            <div
                                className="h-0.5 w-8 mx-0.5 mb-4 rounded-full transition-all duration-500"
                                style={{ background: i < idx ? "linear-gradient(90deg, #6366f1, #8b5cf6)" : "#e2e8f0" }}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function RatingModal({ modal, setModal, onSubmit, submitting, error, success }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ss-fade-in">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full ss-scale-in" style={{ boxShadow: "0 32px 80px rgba(0,0,0,.25)" }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-800 text-slate-900">Rate Product ⭐</h2>
                        <p className="text-sm text-slate-400 mt-0.5">{modal.productName}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModal((m) => ({ ...m, isOpen: false }))}
                        className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-700 text-slate-500 transition-colors"
                    >✕</button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Star selector */}
                    <div>
                        <label className="ss-label">Your Rating</label>
                        <div className="flex gap-2 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setModal((m) => ({ ...m, rating: star }))}
                                    className="text-3xl transition-transform hover:scale-125 active:scale-110"
                                >
                                    <span style={{ color: modal.rating >= star ? "#f59e0b" : "#e2e8f0" }}>★</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="ss-label">Comment (Optional)</label>
                        <textarea
                            value={modal.comment}
                            onChange={(e) => setModal((m) => ({ ...m, comment: e.target.value }))}
                            rows="3"
                            className="ss-input"
                            placeholder="Share your experience…"
                        />
                    </div>

                    {error   && <p className="text-sm font-600 text-red-600   bg-red-50   rounded-xl px-3 py-2">⚠️ {error}</p>}
                    {success && <p className="text-sm font-600 text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">✅ {success}</p>}

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setModal((m) => ({ ...m, isOpen: false }))} className="ss-btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={submitting || !!success} className="ss-btn-primary flex-1">
                            {submitting ? <><span className="ss-spinner" /> Submitting…</> : "Submit Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function MyOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [message, setMessage] = useState("")

    const [ratingModal, setRatingModal] = useState({ isOpen: false, orderId: null, productId: null, productName: "", rating: 5, comment: "" })
    const [submittingRating, setSubmittingRating] = useState(false)
    const [ratingError, setRatingError] = useState("")
    const [ratingSuccess, setRatingSuccess] = useState("")

    const fetchOrders = async ({ isRefresh = false } = {}) => {
        if (isRefresh) setRefreshing(true)
        try {
            const res = await fetch(apiUrl("/orders/my"), { credentials: "include" })
            const data = await res.json()
            if (!res.ok) { setMessage(data.message || "Failed to fetch orders"); return }
            setOrders(data.orders || [])
        } catch { setMessage("Server error") }
        finally { isRefresh ? setRefreshing(false) : setLoading(false) }
    }

    useEffect(() => { fetchOrders() }, [])

    const cancelOrder = async (orderId) => {
        if (!window.confirm("Cancel this order?")) return
        try {
            const res = await fetch(apiUrl(`/orders/${orderId}/cancel`), { method: "PUT", credentials: "include" })
            const data = await res.json()
            if (!res.ok) { setMessage(data.message || "Failed to cancel"); return }
            setMessage(data.message || "Order cancelled")
            fetchOrders()
        } catch { setMessage("Server error") }
    }

    const openRatingModal = (orderId, product) => {
        setRatingModal({ isOpen: true, orderId, productId: product.product, productName: product.name, rating: 5, comment: "" })
        setRatingError("")
        setRatingSuccess("")
    }

    const submitReview = async (e) => {
        e.preventDefault()
        setSubmittingRating(true)
        setRatingError("")
        setRatingSuccess("")
        try {
            const res = await fetch(apiUrl("/reviews"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ productId: ratingModal.productId, orderId: ratingModal.orderId, rating: ratingModal.rating, comment: ratingModal.comment })
            })
            const data = await res.json()
            if (!res.ok) { setRatingError(data.message || "Failed to submit review"); return }
            setRatingSuccess("Review submitted!")
            setTimeout(() => setRatingModal((m) => ({ ...m, isOpen: false })), 1500)
        } catch { setRatingError("Server error") }
        finally { setSubmittingRating(false) }
    }

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-800 tracking-tight text-slate-900">My Orders 📦</h1>
                    <p className="text-slate-500 mt-1 text-sm">Track and manage your recent purchases.</p>
                </div>
                <button
                    onClick={() => fetchOrders({ isRefresh: true })}
                    disabled={refreshing}
                    className="ss-btn-secondary self-start sm:self-auto !text-xs"
                >
                    {refreshing ? <><span className="ss-spinner !border-slate-400 !border-t-slate-700" /> Refreshing…</> : "🔄 Refresh"}
                </button>
            </div>

            {message && (
                <div className="mb-5 ss-glass rounded-2xl px-5 py-3.5 text-sm font-600 text-slate-800 flex items-center gap-2">
                    <span>ℹ️</span> {message}
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="ss-card p-5">
                            <div className="ss-skeleton h-5 w-48 mb-3 rounded-lg" />
                            <div className="ss-skeleton h-4 w-full mb-2 rounded-lg" />
                            <div className="ss-skeleton h-4 w-3/4 rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="ss-card p-12 text-center">
                    <p className="text-6xl mb-4">📭</p>
                    <p className="text-xl font-700 text-slate-700">No orders yet</p>
                    <p className="text-slate-400 mt-2 text-sm">Your placed orders will appear here.</p>
                    <Link to="/" className="ss-btn-primary mt-6 inline-flex">🛍️ Start Shopping</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const sc = STATUS_CONFIG[order.status] || { badge: "ss-badge", icon: "❓", label: order.status }
                        return (
                            <div key={order._id} className="ss-card p-5 !transform-none">
                                {/* Order header */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h2 className="font-800 text-slate-900">Order #{order._id.slice(-6).toUpperCase()}</h2>
                                            <span className={sc.badge}>{sc.icon} {sc.label}</span>
                                        </div>
                                        <p className="text-sm text-slate-500">🏪 {order.store?.name || "N/A"}</p>
                                        <p className="text-sm text-slate-500 mt-0.5">📍 {order.deliveryAddress}</p>
                                        {order.deliveryBoy && (
                                            <p className="text-sm font-600 mt-1" style={{ color: "#10b981" }}>
                                                🚴 {order.deliveryBoy.fullName} · {order.deliveryBoy.mobile}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sm:text-right flex-shrink-0">
                                        <p className="text-2xl font-800 text-slate-900">₹{order.totalAmount}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">+ ₹{order.deliveryCharge || 0} shipping</p>
                                    </div>
                                </div>

                                {/* Status timeline */}
                                <StatusTimeline currentStatus={order.status} />

                                {/* Items */}
                                <div className="mt-4 border-t border-slate-100 pt-4">
                                    <p className="text-xs font-700 uppercase tracking-wider text-slate-400 mb-2">Items</p>
                                    <div className="space-y-2">
                                        {order.items?.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "#f8faff" }}>
                                                <span className="text-sm font-600 text-slate-700 flex items-center gap-2">
                                                    📦 {item.name}
                                                    <span className="text-slate-400 font-500">× {item.quantity}</span>
                                                    {order.status === "delivered" && item.product && (
                                                        <button
                                                            onClick={() => openRatingModal(order._id, item)}
                                                            className="text-[10px] font-700 px-2 py-0.5 rounded-full transition-colors"
                                                            style={{ background: "#fef3c7", color: "#92400e" }}
                                                        >
                                                            ⭐ Rate
                                                        </button>
                                                    )}
                                                </span>
                                                <span className="font-700 text-slate-900 text-sm">₹{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {["pending", "accepted"].includes(order.status) && (
                                        <button onClick={() => cancelOrder(order._id)} className="ss-btn-danger !text-xs">
                                            ❌ Cancel Order
                                        </button>
                                    )}
                                    {["assigned", "dispatched"].includes(order.status) && (
                                        <Link to={`/track/${order._id}`} className="ss-btn-primary !text-xs">
                                            🗺️ Track Order
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Rating modal */}
            {ratingModal.isOpen && (
                <RatingModal
                    modal={ratingModal}
                    setModal={setRatingModal}
                    onSubmit={submitReview}
                    submitting={submittingRating}
                    error={ratingError}
                    success={ratingSuccess}
                />
            )}
        </MainLayout>
    )
}

export default MyOrders