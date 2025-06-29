import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { PlayerProvider } from '../contexts/PlayerContext';

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock API
jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock user service
jest.mock('../services/user', () => ({
  updateUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// All the providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <PlayerProvider>
        {children}
      </PlayerProvider>
    </AuthProvider>
  );
};

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock localStorage
export const createLocalStorageMock = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
