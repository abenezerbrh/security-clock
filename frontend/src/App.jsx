// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import ScanClockIn from './pages/ScanClockIn';
import ActiveRoster from './pages/ActiveRoster';
import ShiftHistory from './pages/ShiftHistory';
import ManageVenues from './pages/ManageVenues';
import GenerateReport from './pages/GenerateReport';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ScanClockIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roster"
            element={
              <ProtectedRoute>
                <ActiveRoster />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute managerOnly>
                <ShiftHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/venues"
            element={
              <ProtectedRoute managerOnly>
                <ManageVenues />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report"
            element={
              <ProtectedRoute managerOnly>
                <GenerateReport />
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
