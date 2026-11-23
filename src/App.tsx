import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StudioProvider, useStudio } from './hooks/useStudioState';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { ToastContainer } from './components/shared/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { ImageToQRPage } from './pages/ImageToQRPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ScannerPage } from './pages/ScannerPage';
import { LibraryPage } from './pages/LibraryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ActivityPage } from './pages/ActivityPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpCenterPage } from './pages/HelpCenterPage';

const ActivePageRouter: React.FC = () => {
  const { route } = useStudio();

  const renderPage = () => {
    switch (route) {
      case 'dashboard':
        return <DashboardPage />;
      case 'generator':
        return <GeneratorPage />;
      case 'image-to-qr':
        return <ImageToQRPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'scanner':
        return <ScannerPage />;
      case 'library':
        return <LibraryPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'activity':
        return <ActivityPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpCenterPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={route}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={{ duration: 0.12 }}
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StudioProvider>
        <AppShell>
          <ActivePageRouter />
        </AppShell>
        <ToastContainer />
      </StudioProvider>
    </ErrorBoundary>
  );
}
