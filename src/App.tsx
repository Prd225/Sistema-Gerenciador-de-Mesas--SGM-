import { ErrorBoundary } from 'react-error-boundary';
import AppLayout from './components/layout/AppLayout';
import RootErrorFallback from './components/layout/RootErrorFallback';

function App() {
  return (
    <ErrorBoundary FallbackComponent={RootErrorFallback}>
      <AppLayout />
    </ErrorBoundary>
  );
}

export default App;
