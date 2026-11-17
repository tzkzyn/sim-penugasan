import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PenugasanProvider } from '@/context/PenugasanContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AppRoutes } from '@/routes/AppRoutes';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PenugasanProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppRoutes />
          </BrowserRouter>
        </PenugasanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
