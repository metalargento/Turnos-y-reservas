import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../api/onboarding';
import type { Business } from '../types';

interface BusinessContextType {
  businesses: Business[];
  activeBusiness: Business | null;
  isLoading: boolean;
  error: string;
  switchBusiness: (businessId: string) => void;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      setError('');
      const result = await onboardingApi.getMyBusinesses();

      if (!result.businesses || result.businesses.length === 0) {
        navigate('/onboarding');
        return;
      }

      setBusinesses(result.businesses);

      // Intentar restaurar el negocio activo desde localStorage
      const savedBusinessId = localStorage.getItem('active_business_id');
      const activeFromStorage = result.businesses.find(b => b.id === savedBusinessId);

      if (activeFromStorage) {
        setActiveBusiness(activeFromStorage);
      } else {
        // Si no hay guardado o no existe, usar el primero
        setActiveBusiness(result.businesses[0]);
        localStorage.setItem('active_business_id', result.businesses[0].id);
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Error al cargar negocios';
      setError(message);
      setBusinesses([]);
      setActiveBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchBusiness = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business) {
      setActiveBusiness(business);
      localStorage.setItem('active_business_id', businessId);
    }
  };

  const refreshBusiness = async () => {
    await loadBusinesses();
  };

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        isLoading,
        error,
        switchBusiness,
        refreshBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusinessContext debe usarse dentro de BusinessProvider');
  }
  return context;
}
