import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sidebar } from './Sidebar';

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
      <nav className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 fixed top-0 left-0 right-0 h-16 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-display font-bold text-xl text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white text-sm">
                ✓
              </div>
              <span>Turnos & Reservas</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 font-display">{user?.email}</span>
              <button
                onClick={toggleTheme}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors z-50 relative"
                title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-ghost text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onHover={setSidebarCollapsed}
        />
        <main className={`flex-1 p-8 animate-fade-in transition-all duration-300 text-neutral-900 dark:text-neutral-100 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
