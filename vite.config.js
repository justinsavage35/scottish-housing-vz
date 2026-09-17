import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/scottish-housing-vz/', // <-- Add this line (include leading and trailing slashes)
});
