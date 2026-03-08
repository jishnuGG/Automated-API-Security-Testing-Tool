import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import ThreatAnalysis from './pages/ThreatAnalysis'
import AttackLogs from './pages/AttackLogs'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import { fetchLogs, fetchStats, fetchWebsites } from './services/api'
import { useAuth } from './context/AuthContext'

function DashboardLayout() {
    const { logout, user } = useAuth()
    const [darkMode, setDarkMode] = useState(true)
    const [currentPage, setCurrentPage] = useState('dashboard')
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState({ high: 0, medium: 0, low: 0, total_websites: 0, total_requests: 0 })
    const [websites, setWebsites] = useState([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        try {
            const [logsData, statsData, websitesData] = await Promise.all([
                fetchLogs(500),
                fetchStats(),
                fetchWebsites(100),
            ])
            setLogs(logsData)
            setStats(statsData)
            setWebsites(websitesData)
        } catch (err) {
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [loadData])

    const renderPage = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Connecting to backend...
                        </p>
                    </div>
                </div>
            )
        }
        switch (currentPage) {
            case 'analysis': return <ThreatAnalysis logs={logs} darkMode={darkMode} />
            case 'logs': return <AttackLogs logs={logs} darkMode={darkMode} onRefresh={loadData} />
            default: return <Dashboard logs={logs} stats={stats} websites={websites} darkMode={darkMode} />
        }
    }

    return (
        <div className={`${darkMode ? 'dark' : ''} h-screen flex overflow-hidden`}>
            <div className={`flex w-full h-full ${darkMode ? 'bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900'}`}>
                <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} darkMode={darkMode} />
                <div className="flex flex-col flex-1 ml-16 overflow-hidden">
                    <Header
                        currentPage={currentPage}
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                        user={user}
                        onLogout={logout}
                    />
                    <main className="flex-1 overflow-y-auto">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </div>
    )
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
                <ProtectedRoute>
                    <DashboardLayout />
                </ProtectedRoute>
            } />
        </Routes>
    )
}

export default App
