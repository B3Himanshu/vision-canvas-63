'use client';

import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Session-level caching: data stays fresh for 30 minutes
        staleTime: 30 * 60 * 1000, // 30 minutes - data is considered fresh
        // Keep data in cache for 2 hours (entire session)
        gcTime: 2 * 60 * 60 * 1000, // 2 hours (formerly cacheTime)
        // Don't refetch on window focus
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect
        refetchOnReconnect: false,
        // Don't refetch on mount if data exists
        refetchOnMount: false,
        // Retry failed requests
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
