import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BarChart3, PlusCircle, History, Cpu, LogOut, User, Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  debugMode: boolean;
  onToggleDebug: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ debugMode, onToggleDebug }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { label: 'New Interview', path: '/interview/new', icon: PlusCircle },
    { label: 'My Interviews', path: '/history', icon: History },
    { label: 'Architecture', path: '/architecture', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-100">AI Adaptive</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-medium">
                AWS 2026
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium hidden sm:block">Interview Coach</p>
          </div>
        </Link>

        {/* Nav Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-brand-400'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Hackathon Debug Toggle */}
          <button
            onClick={onToggleDebug}
            title="Toggle Adaptive Engine Debug Panel (Hackathon judging feature)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              debugMode
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adaptive Engine Debug</span>
            <span className={`w-2 h-2 rounded-full ${debugMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 shadow-sm shadow-brand-500/30 transition-all"
              >
                Start Practising
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
