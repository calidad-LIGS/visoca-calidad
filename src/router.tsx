import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s por defecto para datos dinámicos
        gcTime: 300_000, // 5min en caché aunque no esté montado
        retry: 1, // solo 1 reintento en error
        refetchOnWindowFocus: false, // no refetch al volver a la pestaña
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
