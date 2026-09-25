import { ErrorBoundary } from 'react-error-boundary';
import AppLayout from './components/layout/AppLayout';
import RootErrorFallback from './components/layout/RootErrorFallback';
import { Toaster } from '@/ui/sonner';

function App() {
  return (
    <ErrorBoundary FallbackComponent={RootErrorFallback}>
      <AppLayout />
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
