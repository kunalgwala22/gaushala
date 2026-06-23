import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Heart,
  BarChart3,
  UserSquare,
  LogOut,
  Menu,
  X,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-slate-800"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-saffron-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Define navigation items per role
  const getNavItems = () => {
    const role = user.role;
    const items = [];

    if (role === 'ADMIN') {
      items.push(
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/donors', label: 'Donors', icon: Users },
        { path: '/donations', label: 'Donations', icon: HeartHandshake },
        { path: '/cows', label: 'Cows Management', icon: Heart },
        { path: '/sponsorships', label: 'Sponsorships', icon: PlusCircle },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/staff', label: 'Staff Accounts', icon: UserSquare },
      );
    } else if (role === 'STAFF') {
      items.push(
        { path: '/donors', label: 'Donors', icon: Users },
        { path: '/donations', label: 'Donations', icon: HeartHandshake },
        { path: '/cows', label: 'Cows Directory', icon: Heart },
        { path: '/sponsorships', label: 'Sponsorships', icon: PlusCircle },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
      );
    } else if (role === 'DONOR') {
      items.push(
        { path: '/profile', label: 'My Profile', icon: UserSquare },
        { path: '/donations', label: 'My Donations', icon: HeartHandshake },
        { path: '/sponsorships', label: 'My Sponsorships', icon: PlusCircle },
        { path: '/cows', label: 'Adopt a Cow', icon: Heart },
      );
    }

    return items;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 overflow-x-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/40 backdrop-blur-xl border-r border-slate-800/80 p-5 shrink-0 z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          <span className="text-3xl">🐄</span>
          <div>
            <h1 className="font-display font-bold text-sm tracking-wide text-white leading-none">सांवरिया सेठ</h1>
            <span className="text-[10px] text-saffron-500 font-semibold tracking-wider uppercase">GAUSHALA</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-saffron-500/10 to-saffron-600/5 border border-saffron-500/30 text-saffron-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border border-transparent'
                  }`}
              >
                <Icon size={18} className={isActive ? 'text-saffron-500' : 'text-slate-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 pt-4 mt-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-saffron-500 font-display">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-slate-200 truncate">{user.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors border border-transparent"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header / Navbar */}
      <header className="md:hidden flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 z-30">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐄</span>
          <h1 className="font-display font-bold text-sm tracking-wide text-white leading-none">सांवरिया सेठ गौशाला</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-40 p-5 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐄</span>
                <h1 className="font-display font-bold text-sm text-white leading-none">सांवरिया सेठ</h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                        ? 'bg-saffron-500/10 border border-saffron-500/30 text-saffron-400'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                  >
                    <Icon size={18} className={isActive ? 'text-saffron-500' : 'text-slate-400'} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800/80 pt-4 mt-4">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-saffron-500">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-semibold text-slate-200 truncate">{user.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Top bar on desktop */}
        <header className="hidden md:flex items-center justify-between border-b border-slate-850 px-8 py-4 bg-slate-950/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>System Status: </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-500">Online</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-xs text-slate-500 font-medium leading-none mb-1">Signed in as</span>
              <span className="text-sm font-semibold text-slate-200">{user.email}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-saffron-500 border border-slate-700/80">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic nested routes container */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
