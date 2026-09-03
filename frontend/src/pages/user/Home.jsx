import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import MainLayout from "../../layouts/MainLayout"
import { apiUrl } from "../../api/apiUrl"
import { resolveCurrentAddress } from "../../utils/location"
import { useAuth } from "../../context/AuthContext"

/* ── helpers ── */
const STATUS_BADGE = {
    pending:    { cls: "ss-badge ss-badge-pending",    icon: "🕐" },
    accepted:   { cls: "ss-badge ss-badge-accepted",   icon: "✅" },
    assigned:   { cls: "ss-badge ss-badge-assigned",   icon: "👤" },
    dispatched: { cls: "ss-badge ss-badge-dispatched", icon: "🚚" },
    delivered:  { cls: "ss-badge ss-badge-delivered",  icon: "🎉" },
    cancelled:  { cls: "ss-badge ss-badge-cancelled",  icon: "❌" }
}

function StarRating({ rating, count }) {
    return (
        <div className="flex items-center gap-1 mt-0.5">
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm leading-none ${i < Math.round(rating) ? "text-amber-400" : "text-slate-200"}`}>★</span>
                ))}
            </div>
            {count > 0 && <span className="text-xs text-slate-400">({count})</span>}
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="ss-card overflow-hidden">
            <div className="ss-skeleton h-44 w-full" />
            <div className="p-4 space-y-3">
                <div className="ss-skeleton h-4 w-3/4" />
                <div className="ss-skeleton h-3 w-1/2" />
                <div className="ss-skeleton h-8 w-full mt-2" />
            </div>
        </div>
    )
}

function Home() {
    const navigate = useNavigate()
    const { user, token, refreshUser } = useAuth()
    const [stores, setStores] = useState([])
    const [products, setProducts] = useState([])
    const [cart, setCart] = useState({})
    const [cartOpen, setCartOpen] = useState(false)
    const [placingOrder, setPlacingOrder] = useState(false)
    const [deliveryData, setDeliveryData] = useState({ deliveryAddress: "", latitude: "", longitude: "" })
    const [addressSelected, setAddressSelected] = useState(false)
    const [showNewAddressForm, setShowNewAddressForm] = useState(false)
    const [newAddressData, setNewAddressData] = useState({ label: "", address: "", latitude: "", longitude: "" })
    const [locationStatus, setLocationStatus] = useState("")
    const [keyword, setKeyword] = useState("")
    const [featuredIndex, setFeaturedIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")
    const [cartPulse, setCartPulse] = useState(false)

    const fetchStores = async () => {
        setLoading(true)
        setMessage("")
        try {
            const res = await fetch(apiUrl("/stores"), { credentials: "include" })
            const data = await res.json()
            if (!res.ok) { setMessage(data.message || "Failed to fetch stores"); return }
            const storeList = data.stores || []
            setStores(storeList)
            await fetchAllProducts(storeList)
        } catch { setMessage("Server error") }
        finally { setLoading(false) }
    }

    const fetchAllProducts = async (storeList) => {
        try {
            const results = await Promise.all(
                storeList.map((store) =>
                    fetch(apiUrl(`/stores/${store._id}/products`), { credentials: "include" }).then((r) => r.json())
                )
            )
            const allProducts = results.flatMap((result) =>
                (result.products || []).map((p) => ({ ...p, store: result.store }))
            )
            setProducts(allProducts)
        } catch { setProducts([]) }
    }

    useEffect(() => { fetchStores() }, [])

    const addToCart = (product) => {
        setCart((c) => ({ ...c, [product._id]: { ...product, quantity: (c[product._id]?.quantity || 0) + 1 } }))
        setCartPulse(true)
        setTimeout(() => setCartPulse(false), 600)
    }

    const increaseQty = (product) => setCart((c) => ({ ...c, [product._id]: { ...c[product._id], quantity: (c[product._id]?.quantity || 0) + 1 } }))
    const decreaseQty = (productId) => setCart((c) => {
        const qty = c[productId]?.quantity || 0
        if (qty <= 1) { const n = { ...c }; delete n[productId]; return n }
        return { ...c, [productId]: { ...c[productId], quantity: qty - 1 } }
    })
    const removeItem = (productId) => setCart((c) => { const n = { ...c }; delete n[productId]; return n })

    const handleDeliveryChange = (e) => setDeliveryData({ ...deliveryData, [e.target.name]: e.target.value })
    const handleNewAddressChange = (e) => setNewAddressData({ ...newAddressData, [e.target.name]: e.target.value })

    const detectCurrentLocation = () => {
        if (!navigator.geolocation) { setLocationStatus("Geolocation not supported"); return }
        setLocationStatus("Detecting location…")
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords
                const addr = await resolveCurrentAddress({ latitude, longitude })
                setDeliveryData((d) => ({ ...d, deliveryAddress: addr, latitude, longitude }))
                setAddressSelected(true)
                setNewAddressData((d) => ({ ...d, address: addr, latitude, longitude }))
                setLocationStatus(`📍 ${addr}`)
            },
            () => setLocationStatus("Unable to detect location")
        )
    }

    const useSavedAddress = (addressId) => {
        const sel = user?.addresses?.find((a) => a._id === addressId)
        if (!sel) return
        setDeliveryData({ deliveryAddress: sel.address, latitude: sel.latitude, longitude: sel.longitude })
        setAddressSelected(true)
        setShowNewAddressForm(false)
    }

    const saveNewAddress = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch(apiUrl("/user/address"), {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                credentials: "include",
                body: JSON.stringify({ ...newAddressData, latitude: Number(newAddressData.latitude), longitude: Number(newAddressData.longitude) })
            })
            const data = await res.json()
            if (!res.ok) { setMessage(data.message || "Failed to add address"); return }
            const saved = data.addresses?.[data.addresses.length - 1]
            if (saved) { setDeliveryData({ deliveryAddress: saved.address, latitude: saved.latitude, longitude: saved.longitude }); setAddressSelected(true) }
            setMessage(data.message || "Address added!")
            setNewAddressData({ label: "", address: "", latitude: "", longitude: "" })
            setShowNewAddressForm(false)
            await refreshUser()
        } catch { setMessage("Server error") }
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault()
        setMessage("")
        if (cartItems.length === 0) { setMessage("Please add at least one product"); return }
        if (!addressSelected) { setMessage("Please select an address"); return }
        const storeIds = [...new Set(cartItems.map((i) => i.store?._id).filter(Boolean))]
        if (storeIds.length !== 1) { setMessage("Please order from one store at a time"); return }
        setPlacingOrder(true)
        const storeId = storeIds[0]
        const deliveryCharge = 40
        const totalAmount = itemsTotal + deliveryCharge
        try {
            const res = await fetch(apiUrl("/orders"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    storeId,
                    items: cartItems.map((i) => ({ product: i._id, name: i.name, quantity: i.quantity, price: i.price })),
                    deliveryAddress: deliveryData.deliveryAddress,
                    deliveryLocation: { latitude: Number(deliveryData.latitude), longitude: Number(deliveryData.longitude) },
                    totalAmount,
                    deliveryCharge
                })
            })
            const data = await res.json()
            if (!res.ok) { setMessage(data.message || "Failed to place order"); return }
            setMessage("🎉 Order placed successfully!")
            setCart({})
            setAddressSelected(false)
            setDeliveryData({ deliveryAddress: "", latitude: "", longitude: "" })
            setCartOpen(false)
            setTimeout(() => navigate("/my-orders"), 700)
        } catch { setMessage("Server error") }
        finally { setPlacingOrder(false) }
    }

    const cartItems = useMemo(() => Object.values(cart), [cart])
    const itemsTotal = useMemo(() => cartItems.reduce((t, i) => t + i.price * i.quantity, 0), [cartItems])
    const cartCount = useMemo(() => cartItems.reduce((t, i) => t + i.quantity, 0), [cartItems])
    const deliveryCharge = cartItems.length > 0 ? 25 : 0
    const handlingCharge = cartItems.length > 0 ? 2 : 0
    const grandTotal = itemsTotal + deliveryCharge + handlingCharge
    const canPlaceOrder = cartItems.length > 0 && addressSelected
    const normalizedKeyword = keyword.trim().toLowerCase()

    const filteredStores = useMemo(() => {
        if (!normalizedKeyword) return stores
        return stores.filter((s) =>
            (s.name || "").toLowerCase().includes(normalizedKeyword) ||
            (s.category || "").toLowerCase().includes(normalizedKeyword) ||
            (s.address || "").toLowerCase().includes(normalizedKeyword)
        )
    }, [stores, normalizedKeyword])

    const filteredProducts = useMemo(() => {
        if (!normalizedKeyword) return products
        return products.filter((p) =>
            (p.name || "").toLowerCase().includes(normalizedKeyword) ||
            (p.description || "").toLowerCase().includes(normalizedKeyword) ||
            (p.store?.name || "").toLowerCase().includes(normalizedKeyword) ||
            (p.category || "").toLowerCase().includes(normalizedKeyword)
        )
    }, [products, normalizedKeyword])

    const featuredProducts = useMemo(() =>
        [...(normalizedKeyword ? filteredProducts : products)]
            .filter((p) => p.image && p.store?._id)
            .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5),
        [filteredProducts, normalizedKeyword, products]
    )

    useEffect(() => { setFeaturedIndex(0) }, [normalizedKeyword, products])
    useEffect(() => {
        if (featuredProducts.length <= 1) return
        const interval = setInterval(() => setFeaturedIndex((i) => (i + 1) % featuredProducts.length), 4500)
        return () => clearInterval(interval)
    }, [featuredProducts.length])

    const activeFeaturedProduct = featuredProducts[featuredIndex]

    /* Category icons */
    const CATEGORY_ICONS = { electronics: "⚡", food: "🍔", fashion: "👗", grocery: "🛒", health: "💊", beauty: "💄", sports: "⚽", books: "📚", toys: "🎮", general: "📦" }
    const getCatIcon = (cat) => CATEGORY_ICONS[(cat || "").toLowerCase()] || "🏪"

    return (
        <MainLayout>
            {/* ── Message toast ── */}
            {message && (
                <div className="mb-5 ss-glass rounded-2xl px-5 py-3.5 text-sm font-600 text-slate-800 flex items-center gap-2 ss-slide-up">
                    <span className="text-base">{message.includes("Error") || message.includes("error") ? "⚠️" : "ℹ️"}</span>
                    {message}
                </div>
            )}

            {loading ? (
                /* ── Skeleton loading ── */
                <>
                    <div className="ss-skeleton h-80 w-full rounded-3xl mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </>
            ) : (
                <>
                    {/* ── Hero carousel ── */}
                    {featuredProducts.length > 0 && (
                        <section className="mb-8">
                            <div className="relative overflow-hidden rounded-3xl shadow-xl" style={{ background: "#0a0f1e" }}>
                                <div
                                    key={activeFeaturedProduct._id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { addToCart(activeFeaturedProduct); setCartOpen(true) }}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addToCart(activeFeaturedProduct); setCartOpen(true) } }}
                                    className="group relative block min-h-72 cursor-pointer outline-none sm:min-h-96 ss-fade-in"
                                    style={{ minHeight: 360 }}
                                >
                                    <img
                                        src={activeFeaturedProduct.image}
                                        alt={activeFeaturedProduct.name}
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.45) 55%, rgba(0,0,0,.08) 100%)" }} />
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 50%)" }} />

                                    <div className="absolute inset-0 flex items-end p-6 sm:p-10">
                                        <div className="max-w-xl text-white">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className="ss-badge" style={{ background: "rgba(255,255,255,.15)", color: "#fff", backdropFilter: "blur(8px)" }}>
                                                    ✨ TOP PICK
                                                </span>
                                                <span className="ss-badge" style={{ background: "#f59e0b", color: "#fff" }}>
                                                    ₹{activeFeaturedProduct.price}
                                                </span>
                                            </div>

                                            <h2 className="text-3xl font-800 tracking-tight leading-tight sm:text-4xl lg:text-5xl mb-3">
                                                {activeFeaturedProduct.name}
                                            </h2>

                                            <p className="text-sm leading-6 text-white/75 max-w-lg line-clamp-2 mb-5">
                                                {activeFeaturedProduct.description || "Tap to add this product to your cart."}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className="rounded-full px-4 py-2 text-sm font-700 text-slate-900"
                                                    style={{ background: "#fff" }}
                                                >
                                                    {activeFeaturedProduct.store?.name}
                                                </span>
                                                <span
                                                    className="rounded-full px-4 py-2 text-sm font-600 text-white capitalize"
                                                    style={{ background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.25)" }}
                                                >
                                                    {activeFeaturedProduct.category}
                                                </span>
                                                <span
                                                    className="group-hover:bg-indigo-600 transition-colors duration-200 rounded-full px-5 py-2 text-sm font-700 text-white flex items-center gap-1.5"
                                                    style={{ background: "rgba(99,102,241,.7)", backdropFilter: "blur(8px)" }}
                                                >
                                                    🛒 Add to Cart
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Carousel controls */}
                                {featuredProducts.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            aria-label="Previous"
                                            onClick={(e) => { e.stopPropagation(); setFeaturedIndex((i) => (i - 1 + featuredProducts.length) % featuredProducts.length) }}
                                            className="absolute right-20 top-5 z-20 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-sm font-700 text-white backdrop-blur-md transition hover:bg-black/60"
                                        >← Prev</button>
                                        <button
                                            type="button"
                                            aria-label="Next"
                                            onClick={(e) => { e.stopPropagation(); setFeaturedIndex((i) => (i + 1) % featuredProducts.length) }}
                                            className="absolute right-5 top-5 z-20 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-sm font-700 text-white backdrop-blur-md transition hover:bg-black/60"
                                        >Next →</button>

                                        {/* Dot indicators */}
                                        <div className="absolute bottom-5 right-6 z-20 flex gap-2">
                                            {featuredProducts.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    aria-label={`Slide ${idx + 1}`}
                                                    onClick={(e) => { e.stopPropagation(); setFeaturedIndex(idx) }}
                                                    className={`rounded-full transition-all duration-300 ${idx === featuredIndex ? "w-8 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/65"}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── Search + Heading ── */}
                    <div className="mb-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-800 tracking-tight text-slate-900">Discover Stores</h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {normalizedKeyword
                                    ? `${filteredStores.length} store${filteredStores.length !== 1 ? "s" : ""} · ${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`
                                    : `${stores.length} stores · ${products.length} products`}
                            </p>
                        </div>

                        {/* Search bar */}
                        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-72">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="ss-input pl-10 pr-9"
                                    placeholder="Search stores or products…"
                                />
                                {keyword && (
                                    <button
                                        type="button"
                                        onClick={() => setKeyword("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-base"
                                    >✕</button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* ── Stores horizontal scroll ── */}
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">🏪</span>
                            <h2 className="ss-section-title">Popular Stores</h2>
                        </div>

                        {filteredStores.length === 0 ? (
                            <div className="ss-card p-8 text-center text-slate-400">
                                <p className="text-4xl mb-3">🔍</p>
                                <p className="font-600">No stores found</p>
                            </div>
                        ) : (
                            <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
                                {filteredStores.map((store) => (
                                    <Link
                                        key={store._id}
                                        to={`/stores/${store._id}`}
                                        className="group flex-shrink-0 w-64 ss-card p-5 no-underline block"
                                        style={{ textDecoration: "none" }}
                                    >
                                        {/* Store avatar */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div
                                                className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl"
                                                style={{ background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)" }}
                                            >
                                                {getCatIcon(store.category)}
                                            </div>
                                            <span className={`ss-badge ${store.isOpen ? "ss-badge-open" : "ss-badge-closed"}`}>
                                                {store.isOpen ? "● Open" : "● Closed"}
                                            </span>
                                        </div>

                                        <h3 className="font-800 text-slate-900 text-base leading-snug group-hover:text-indigo-700 transition-colors">
                                            {store.name}
                                        </h3>
                                        <p className="text-xs font-600 uppercase tracking-wider text-slate-400 mt-0.5 capitalize">
                                            {store.category}
                                        </p>

                                        <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                                            {store.address}
                                        </p>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <p className="text-xs text-slate-400">by {store.seller?.fullName || "N/A"}</p>
                                            <span className="text-indigo-500 text-xs font-700 group-hover:translate-x-1 transition-transform inline-block">
                                                View →
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Products grid ── */}
                    <section>
                        <div className="flex items-center gap-2 mb-5">
                            <span className="text-xl">✨</span>
                            <div>
                                <h2 className="ss-section-title">All Products</h2>
                                <p className="ss-section-subtitle">{filteredProducts.length} products available</p>
                            </div>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="ss-card p-10 text-center text-slate-400">
                                <p className="text-5xl mb-3">📦</p>
                                <p className="font-600 text-lg">No products found</p>
                                <p className="text-sm mt-1">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        cart={cart}
                                        onAdd={(p) => { addToCart(p); setCartOpen(true) }}
                                        onIncrease={increaseQty}
                                        onDecrease={decreaseQty}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* ── Floating cart button ── */}
            <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="fixed bottom-6 right-6 z-30 flex items-center gap-3 rounded-2xl text-white px-5 py-3.5 transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    boxShadow: "0 8px 32px rgba(99,102,241,.45)"
                }}
            >
                {/* Pulse ring when item added */}
                {cartPulse && (
                    <span
                        className="absolute inset-0 rounded-2xl"
                        style={{ border: "2px solid rgba(99,102,241,.5)", animation: "pulse-ring 0.6s ease-out forwards" }}
                    />
                )}
                <span className="text-xl">🛒</span>
                <span>
                    <span className="font-700 text-sm block leading-none">
                        {cartCount > 0 ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "Cart"}
                    </span>
                    <span className="text-xs font-500 opacity-90 block mt-0.5">₹{grandTotal}</span>
                </span>
                {cartCount > 0 && (
                    <span
                        className="flex items-center justify-center h-5 w-5 rounded-full text-xs font-800 text-indigo-700"
                        style={{ background: "#fff" }}
                    >
                        {cartCount}
                    </span>
                )}
            </button>

            {/* ── Cart drawer ── */}
            {cartOpen && (
                <>
                    {/* Backdrop */}
                    <button
                        type="button"
                        aria-label="Close cart"
                        onClick={() => setCartOpen(false)}
                        className="fixed inset-0 z-40 ss-fade-in"
                        style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(2px)" }}
                    />

                    {/* Drawer */}
                    <aside
                        className="fixed right-0 top-0 h-full z-50 flex flex-col ss-drawer"
                        style={{ width: "min(420px, 100vw)", background: "#fff", boxShadow: "-8px 0 60px rgba(0,0,0,.18)" }}
                    >
                        {/* Drawer header */}
                        <div
                            className="px-5 py-4 flex items-center justify-between border-b border-slate-100"
                            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                        >
                            <div>
                                <h2 className="text-lg font-800 text-white">Your Cart 🛒</h2>
                                <p className="text-xs text-indigo-200 font-500">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCartOpen(false)}
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors text-lg font-700"
                            >✕</button>
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cartItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                    <p className="text-5xl mb-3">🛒</p>
                                    <p className="font-600 text-base">Your cart is empty</p>
                                    <p className="text-sm mt-1">Add products to get started</p>
                                </div>
                            ) : cartItems.map((item) => (
                                <div key={item._id} className="ss-card p-3 flex gap-3 !transform-none">
                                    <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                                        {item.image
                                            ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                            : <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-700 text-slate-900 text-sm line-clamp-1">{item.name}</h3>
                                                <p className="text-xs text-slate-400 line-clamp-1">{item.store?.name}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item._id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
                                            >×</button>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <p className="font-800 text-slate-900 text-sm">₹{item.price}</p>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => decreaseQty(item._id)}
                                                    className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-700 text-base flex items-center justify-center transition-colors"
                                                >−</button>
                                                <span className="w-7 text-center text-sm font-700">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => increaseQty(item)}
                                                    disabled={item.quantity >= item.stock}
                                                    className="h-7 w-7 rounded-lg text-white font-700 text-base flex items-center justify-center transition-colors disabled:opacity-40"
                                                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cart footer */}
                        <div className="border-t border-slate-100 p-4 space-y-3" style={{ background: "#fafbff" }}>
                            {/* Price summary */}
                            <div className="ss-card !transform-none p-4 space-y-2 !shadow-sm">
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span>Items total</span>
                                    <span className="font-600">₹{itemsTotal}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span>🚚 Shipping</span>
                                    <span className="font-600">{deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span>⚙️ Handling</span>
                                    <span className="font-600">₹{handlingCharge}</span>
                                </div>
                                <div className="flex items-center justify-between text-base font-800 text-slate-900 pt-2 border-t border-slate-100">
                                    <span>Total</span>
                                    <span style={{ color: "#6366f1" }}>₹{grandTotal}</span>
                                </div>
                            </div>

                            {/* Address section */}
                            <form onSubmit={handlePlaceOrder} className="space-y-3">
                                <p className="text-xs font-700 uppercase tracking-wider text-slate-500">📍 Delivery Address</p>

                                <button
                                    type="button"
                                    onClick={detectCurrentLocation}
                                    className="ss-btn-secondary w-full !text-xs"
                                >
                                    {locationStatus === "Detecting location…" ? "📍 Detecting…" : "📍 Use Current Location"}
                                </button>

                                {locationStatus && locationStatus !== "Detecting location…" && (
                                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{locationStatus}</p>
                                )}

                                {!addressSelected && cartItems.length > 0 && (
                                    <p className="text-xs font-600 text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                                        ⚠️ Please select a delivery address
                                    </p>
                                )}

                                {addressSelected && (
                                    <p className="text-xs font-600 text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                                        ✅ {deliveryData.deliveryAddress}
                                    </p>
                                )}

                                {user?.addresses?.length > 0 && (
                                    <select
                                        defaultValue=""
                                        onChange={(e) => useSavedAddress(e.target.value)}
                                        className="ss-input !text-xs"
                                    >
                                        <option value="" disabled>Use saved address…</option>
                                        {user.addresses.map((a) => (
                                            <option key={a._id} value={a._id}>{a.label} — {a.address}</option>
                                        ))}
                                    </select>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setShowNewAddressForm((s) => !s)}
                                    className="ss-btn-secondary w-full !text-xs"
                                >
                                    {showNewAddressForm ? "✕ Hide form" : "+ Add New Address"}
                                </button>

                                {showNewAddressForm && (
                                    <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-white ss-slide-up">
                                        <input name="label"   value={newAddressData.label}   onChange={handleNewAddressChange} required className="ss-input !text-xs" placeholder="Label (Home, Office…)" />
                                        <textarea name="address" value={newAddressData.address} onChange={handleNewAddressChange} required rows="2" className="ss-input !text-xs" placeholder="Full delivery address" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input name="latitude"  value={newAddressData.latitude}  onChange={handleNewAddressChange} required className="ss-input !text-xs" placeholder="Latitude"  />
                                            <input name="longitude" value={newAddressData.longitude} onChange={handleNewAddressChange} required className="ss-input !text-xs" placeholder="Longitude" />
                                        </div>
                                        <button type="button" onClick={detectCurrentLocation} className="ss-btn-secondary w-full !text-xs">📍 Detect Location</button>
                                        <button type="button" onClick={saveNewAddress} className="ss-btn-primary w-full !text-xs">Save & Use Address</button>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={placingOrder || !canPlaceOrder}
                                    className="ss-btn-primary w-full !py-3.5"
                                >
                                    {placingOrder ? <><span className="ss-spinner" /> Placing order…</> : "🛍️ Place Order"}
                                </button>
                            </form>
                        </div>
                    </aside>
                </>
            )}
        </MainLayout>
    )
}

/* ── Product card component ── */
function ProductCard({ product, cart, onAdd, onIncrease, onDecrease }) {
    const inCart = cart[product._id]
    const [wished, setWished] = useState(false)

    return (
        <div className="ss-card overflow-hidden flex flex-col">
            {/* Image */}
            <div className="relative overflow-hidden" style={{ height: 180 }}>
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                ) : (
                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-4xl">📦</div>
                )}

                {/* Wishlist heart */}
                <button
                    type="button"
                    onClick={() => setWished((w) => !w)}
                    className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center text-base shadow-sm hover:scale-110 transition-transform"
                    aria-label="Wishlist"
                >
                    {wished ? "❤️" : "🤍"}
                </button>

                {/* Low stock warning */}
                {product.stock > 0 && product.stock <= 5 && (
                    <span
                        className="absolute bottom-2 left-2 text-[10px] font-700 px-2 py-0.5 rounded-full"
                        style={{ background: "#fef3c7", color: "#92400e" }}
                    >
                        Only {product.stock} left!
                    </span>
                )}
                {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-700 text-sm bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="p-3.5 flex flex-col flex-1">
                <h3 className="font-700 text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{product.name}</h3>

                {product.reviewCount > 0
                    ? <StarRating rating={product.averageRating} count={product.reviewCount} />
                    : <p className="text-[10px] text-slate-400 mt-0.5">No ratings yet</p>
                }

                <p className="text-xs text-slate-400 mt-1 truncate">{product.store?.name}</p>

                <div className="mt-auto pt-3">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-base font-800 text-slate-900">₹{product.price}</p>
                        <span className="text-[10px] font-600 px-2 py-0.5 rounded-full" style={{ background: "#eef2ff", color: "#4338ca" }}>
                            Stock {product.stock}
                        </span>
                    </div>

                    {inCart ? (
                        <div
                            className="flex items-center justify-between rounded-xl overflow-hidden text-white"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                        >
                            <button type="button" onClick={() => onDecrease(product._id)} className="flex-1 py-2.5 text-lg font-700 hover:bg-white/10 transition-colors">−</button>
                            <span className="min-w-10 text-center text-sm font-800">{inCart.quantity}</span>
                            <button type="button" onClick={() => onIncrease(product)} disabled={inCart.quantity >= product.stock} className="flex-1 py-2.5 text-lg font-700 hover:bg-white/10 transition-colors disabled:opacity-40">+</button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onAdd(product)}
                            disabled={product.stock === 0}
                            className="w-full py-2.5 text-sm font-700 rounded-xl transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed hover:text-white"
                            style={{
                                borderColor: "#6366f1",
                                color: "#6366f1",
                                background: "transparent"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg,#6366f1,#8b5cf6)"; e.currentTarget.style.color = "#fff" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6366f1" }}
                        >
                            {product.stock === 0 ? "Out of Stock" : "ADD"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Home