import Navbar from "../components/common/Navbar"

function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-800">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
}

export default MainLayout