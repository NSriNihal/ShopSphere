import Navbar from "../components/common/Navbar"

function MainLayout({ children }) {
    return (
        <div
            className="min-h-screen text-slate-800"
            style={{
                background: "linear-gradient(135deg, #f0f2ff 0%, #e8edfb 40%, #f5f0ff 100%)"
            }}
        >
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
                {children}
            </main>
        </div>
    )
}

export default MainLayout