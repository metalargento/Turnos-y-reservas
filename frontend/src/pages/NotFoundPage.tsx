import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-500 mt-2">Página no encontrada</p>
        <Link to="/dashboard">
          <Button className="mt-6">Ir al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
