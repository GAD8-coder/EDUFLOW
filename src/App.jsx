import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, BookOpen, Settings, ChevronLeft, ChevronRight, AlertTriangle, User, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import PanicMode from './pages/PanicMode';
import ProfileModal from './components/ProfileModal';

const Sidebar = ({ isExpanded, toggleExpanded, currentPage, navigateToPage, onPanicMode }) => (
  <aside className={`notion-sidebar ${isExpanded ? 'notion-sidebar-expanded' : 'notion-sidebar-collapsed'}`}>
    <div className="p-4 flex flex-col h-full">
      {/* Toggle button */}
      <button onClick={toggleExpanded} className="notion-nav-item w-full mb-6">
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        {isExpanded && <span className="ml-2 font-heading text-sm font-bold text-accent">EduFlow</span>}
      </button>

      <nav className="space-y-1 flex-1">
        {[
          { page: 'dashboard', label: 'Dashboard', Icon: Home },
          { page: 'resources', label: 'Resources', Icon: BookOpen },
          { page: 'settings',  label: 'Settings',  Icon: Settings },
        ].map(({ page, label, Icon }) => (
          <div
            key={page}
            onClick={() => navigateToPage(page)}
            className={`notion-nav-item ${currentPage === page ? 'active' : ''}`}
          >
            <Icon size={16} />
            {isExpanded && <span className="ml-3 text-sm">{label}</span>}
          </div>
        ))}
      </nav>

      {/* Panic Mode button at the bottom of sidebar */}
      <button
        onClick={onPanicMode}
        className="notion-nav-item text-red-400 hover:text-red-300 hover:bg-red-950/30 mt-auto"
      >
        <AlertTriangle size={16} />
        {isExpanded && <span className="ml-3 text-sm font-semibold">Panic Mode</span>}
      </button>
    </div>
  </aside>
);

const AppContent = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showPanicMode, setShowPanicMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navigateToPage = (page) => { setCurrentPage(page); setMobileMenuOpen(false); };

  const sidebarWidth = sidebarExpanded ? 240 : 60;

  return (
    <div className="flex h-screen" style={{ background: 'var(--background)' }}>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isExpanded={sidebarExpanded}
          toggleExpanded={() => setSidebarExpanded(v => !v)}
          currentPage={currentPage}
          navigateToPage={navigateToPage}
          onPanicMode={() => setShowPanicMode(true)}
        />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 z-50 lg:hidden"
            >
              <Sidebar
                isExpanded={true}
                toggleExpanded={() => setMobileMenuOpen(false)}
                currentPage={currentPage}
                navigateToPage={navigateToPage}
                onPanicMode={() => { setShowPanicMode(true); setMobileMenuOpen(false); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div
        className="flex-1 flex flex-col h-screen overflow-hidden"
        style={{ marginLeft: `${sidebarWidth}px`, transition: 'margin-left 0.3s ease' }}
      >
        {/* Top header bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {/* Mobile menu button */}
          <button className="lg:hidden notion-nav-item" onClick={() => setMobileMenuOpen(true)}>
            <span className="text-sm">☰</span>
          </button>
          <div className="flex-1" />
          {/* Profile avatar */}
          <button className="profile-avatar" onClick={() => setShowProfile(true)}>
            <User size={16} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {showPanicMode ? (
            <PanicMode onExit={() => setShowPanicMode(false)} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentPage === 'dashboard' && <Dashboard onNavigateToPanicMode={() => setShowPanicMode(true)} />}
                {currentPage === 'resources'  && <Resources />}
                {currentPage === 'settings'   && (
                  <div className="notion-section">
                    <div className="notion-card text-center">
                      <Settings size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
                      <h2 className="font-heading text-xl mb-2">Settings</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>Coming soon!</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return <AppProvider><AppContent /></AppProvider>;
}
