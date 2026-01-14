/**
 * Main Application Component
 * Refactored for better organization and code splitting
 */

import { AppProviders } from "@/app/providers";
import { AppRoutes } from "@/app/routes";

const App = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);

export default App;
