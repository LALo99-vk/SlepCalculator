import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import History from './pages/History';
import Quotations from './pages/Quotations';
import QuotationView from './pages/QuotationView';
import Clients from './pages/Clients';
import Materials from './pages/Materials';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Profile from './pages/Profile';
import CustomRecordTypes from './pages/CustomRecordTypes';
import CustomRecordEntries from './pages/CustomRecordEntries';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/quotations/view/:quoteNumber" element={<QuotationView />} />
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="calculator" element={<Calculator />} />
                  <Route path="history" element={<History />} />
                  <Route path="quotations/*" element={<Quotations />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="materials" element={<Materials />} />
                  <Route path="custom-records" element={<CustomRecordTypes />} />
                  <Route path="custom-records/:typeId" element={<CustomRecordEntries />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="users" element={<Users />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Routes>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'dark:bg-slate-800 dark:text-white',
                  duration: 4000,
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;