import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split heavyweight, rarely-changing vendors into their own chunks so the
    // critical entry bundle stays small and cacheable (better FCP/LCP).
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'vendor-motion';
          }
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'vendor-charts';
          }
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          return undefined;
        },
      },
    },
    // Fail the build if any chunk balloons unexpectedly.
    chunkSizeWarningLimit: 700,
  },
});
