import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="bg-white border-b border-neutral-200 fixed top-0 left-0 right-0 h-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 font-display font-bold text-xl text-primary-600 hover:text-primary-700 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white text-sm">
                ✓
              </div>
              <span>Turnos & Reservas</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600 font-display">{user?.email}</span>
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
        <Sidebar />
        <main className="flex-1 ml-64 p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
