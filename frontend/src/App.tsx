import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PenugasanProvider } from '@/context/PenugasanContext';
import { AppRoutes } from '@/routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <PenugasanProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </PenugasanProvider>
    </AuthProvider>
  );
}

export default App;
