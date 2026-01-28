'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Auth initializer component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initCalled = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initCalled.current) return;
    initCalled.current = true;

    const initAuth = async () => {
      const storedAuth = useAuthStore.getState();

      // Only attempt refresh if we have a stored session
      if (!storedAuth.isAuthenticated || !storedAuth.accessToken) {
        setIsInitialized(true);
        return;
      }

      // Try to refresh the token using the cookie
      try {
        const response = await axios.post<{
          success: boolean;
          data?: { accessToken: string };
        }>(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data.success && response.data.data) {
          useAuthStore.getState().setAccessToken(response.data.data.accessToken);
        } else {
          // Clear stale auth state
          useAuthStore.getState().logout();
        }
      } catch {
        // Clear stale auth state
        useAuthStore.getState().logout();
      }

      setIsInitialized(true);
    };

    initAuth();
  }, []);

  // Show nothing while initializing to prevent flash
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
