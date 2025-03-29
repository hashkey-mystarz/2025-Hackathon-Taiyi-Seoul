"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // 모바일 환경에서 백그라운드에서 포어그라운드로 올라올 때 필요
      retry: false,
      // retryDelay: (attempt) => Math.min(1000 * 3 ** attempt, 30000),
    },
  },
});

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
