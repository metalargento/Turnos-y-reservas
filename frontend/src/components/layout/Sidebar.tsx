import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBusinessContext } from '../../contexts/BusinessContext';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/bookings', label: 'Reservas', icon: '📅' },
  { path: '/services', label: 'Servicios', icon: '🔧' },
  { path: '/branches', label: 'Sucursales', icon: '📍' },
  { path: '/professionals', label: 'Profesionales', icon: '👥' },
  { path: '/availability', label: 'Disponibilidad', icon: '⏰' },
  { path: '/settings', label: 'Configuración', icon: '⚙️' },
];

export function Sidebar() {
  const location = useLocation();
  const { businesses, activeBusiness, switchBusiness } = useBusinessContext();
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);

  return (
    <aside className="w-64 bg-gradient-to-b from-neutral-900 to-neutral-800 text-white h-screen overflow-y-auto fixed left-0 top-0 pt-16 border-r border-neutral-700">
      {/* Business switcher */}
      <div className="p-4 border-b border-neutral-700">
        <div className="relative">
          <button
            onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-display font-semibold text-neutral-100 transition-all duration-200"
          >
            <span className="truncate">{activeBusiness?.name || 'Sin negocio'}</span>
            <span className="text-xs ml-2 opacity-60">{businesses.length > 1 ? '⇅' : ''}</span>
          </button>

          {/* Dropdown menu */}
          {showBusinessMenu && businesses.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg z-50 animate-fade-slide-in">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => {
                    switchBusiness(business.id);
                    setShowBusinessMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 ${
                    business.id === activeBusiness?.id
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100'
                  }`}
                >
                  {business.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="space-y-1 p-4">
        {MENU_ITEMS.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                animationDelay: `${index * 0.05}s`,
              }}
              className={`nav-link group ${
                isActive ? 'nav-link-active' : 'nav-link-inactive text-neutral-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className={`font-display font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-r-md" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-700 bg-neutral-900 text-xs text-neutral-500">
        <p>v0.3 — Turnos & Reservas</p>
      </div>
    </aside>
  );
}
