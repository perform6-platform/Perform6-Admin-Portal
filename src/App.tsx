import { Route, Routes } from 'react-router-dom';
import Categories from './pages/Categories';
import ContentLibrary from './pages/ContentLibrary';
import ContentSyncing from './pages/ContentSyncing';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DeviceLogs from './pages/DeviceLogs';
import DeviceMonitoring from './pages/DeviceMonitoring';
import Deployments from './pages/Deployments';
import Rotation from './pages/Rotation';
import RotationSchedule from './pages/RotationSchedule';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import OtaReleases from './pages/OtaReleases';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import StartupFiles from './pages/StartupFiles';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/device-monitoring" element={<DeviceMonitoring />} />
          <Route path="/device-logs" element={<DeviceLogs />} />
          <Route path="/content-syncing" element={<ContentSyncing />} />
          <Route path="/content-library" element={<ContentLibrary />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/rotation" element={<Rotation />} />
          <Route path="/rotation-schedule" element={<RotationSchedule />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/startup-files" element={<StartupFiles />} />
          <Route path="/ota-releases" element={<OtaReleases />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}
