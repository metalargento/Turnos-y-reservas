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
    <aside className="w-64 bg-gray-900 text-white h-screen overflow-y-auto fixed left-0 top-0 pt-16">
      {/* Business switcher */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowBusinessMenu(!showBusinessMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-100 transition"
          >
            <span className="truncate">{activeBusiness?.name || 'Sin negocio'}</span>
            <span className="text-xs ml-2">{businesses.length > 1 ? '⇅' : ''}</span>
          </button>

          {/* Dropdown menu */}
          {showBusinessMenu && businesses.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => {
                    switchBusiness(business.id);
                    setShowBusinessMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    business.id === activeBusiness?.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
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
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
