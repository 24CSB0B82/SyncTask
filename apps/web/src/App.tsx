import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/Tooltip';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
