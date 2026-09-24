import Navbar from "../components/common/Navbar"

function MainLayout({ children }) {
    return (
        <div className="ss-app-shell min-h-screen text-slate-800">
            <Navbar />
            <main className="ss-page-enter mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
                {children}
            </main>
        </div>
    )
}

export default MainLayout
