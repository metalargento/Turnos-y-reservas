import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
  { path: '/settings', label: 'Configuración', icon: '⚙️' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen overflow-y-auto fixed left-0 top-0 pt-16">
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
