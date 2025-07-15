import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import HomePage from '@/pages/public/HomePage';
import DashboardPage from '@/pages/public/DashboardPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import Profile from '@/pages/Profile';
import LogbookPage from '@/pages/Logbook';
import RegistrationVerificationPage from '@/pages/RegistrationVerificationPage';
import UserList from '@/pages/admin/user/UserList';
import AdminUserDetails from '@/pages/admin/user/UserEdit';
import DictionaryList from '@/pages/admin/config/DictionaryList';
import DictionaryEdit from '@/pages/admin/config/DictionaryEdit';
import JumpTypeList from '@/pages/admin/config/JumpTypeList';
import JumpTypeEdit from '@/pages/admin/config/JumpTypeEdit';
import AircraftList from '@/pages/admin/config/AircraftList';
import AircraftEdit from '@/pages/admin/config/AircraftEdit';
import ManifestingPage from '@/pages/admin/ManifestingPage';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { RequireRegistration, RequireCompletedRegistration } from '@/components/auth/RegistrationGuard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
        handle: { hideHeader: true },
      },
      {
        path: 'admin/users',
        element: <RequireCompletedRegistration><RoleGuard permission="MANAGE_USERS" requireAuth={true} use404Fallback={true}><UserList /></RoleGuard></RequireCompletedRegistration>,
      },
      {
        path: 'admin/users/new',
        element: <RequireCompletedRegistration><RoleGuard permission="MANAGE_USERS" requireAuth={true} use404Fallback={true}><AdminUserDetails /></RoleGuard></RequireCompletedRegistration>,
      },
      {
        path: 'admin/users/:id',
        element: <RequireCompletedRegistration><RoleGuard permission="MANAGE_USERS" requireAuth={true} use404Fallback={true}><AdminUserDetails /></RoleGuard></RequireCompletedRegistration>,
      },
      {
        path: 'profile',
        element: <RequireCompletedRegistration><Profile /></RequireCompletedRegistration>,
      },
      {
        path: 'registration/verify',
        element: <RequireRegistration><RegistrationVerificationPage /></RequireRegistration>,
      },
      {
        path: 'logbook',
        element: <RequireCompletedRegistration><LogbookPage /></RequireCompletedRegistration>,
      },
      {
        path: 'admin/dictionaries',
        element: <RoleGuard permission="MANAGE_SETTINGS" requireAuth={true} use404Fallback={true}><DictionaryList /></RoleGuard>,
      },
      {
        path: 'admin/dictionaries/:id',
        element: <RoleGuard permission="MANAGE_SETTINGS" requireAuth={true} use404Fallback={true}><DictionaryEdit /></RoleGuard>,
      },
      {
        path: 'admin/jump-types',
        element: <RoleGuard permission="MANAGE_JUMP_TYPES" requireAuth={true} use404Fallback={true}><JumpTypeList /></RoleGuard>,
      },
      {
        path: 'admin/jump-types/new',
        element: <RoleGuard permission="MANAGE_JUMP_TYPES" requireAuth={true} use404Fallback={true}><JumpTypeEdit /></RoleGuard>,
      },
      {
        path: 'admin/jump-types/:id',
        element: <RoleGuard permission="MANAGE_JUMP_TYPES" requireAuth={true} use404Fallback={true}><JumpTypeEdit /></RoleGuard>,
      },
      {
        path: 'admin/aircraft',
        element: <RoleGuard permission="MANAGE_AIRCRAFT" requireAuth={true} use404Fallback={true}><AircraftList /></RoleGuard>,
      },
      {
        path: 'admin/aircraft/new',
        element: <RoleGuard permission="MANAGE_AIRCRAFT" requireAuth={true} use404Fallback={true}><AircraftEdit /></RoleGuard>,
      },
      {
        path: 'admin/aircraft/:id',
        element: <RoleGuard permission="MANAGE_AIRCRAFT" requireAuth={true} use404Fallback={true}><AircraftEdit /></RoleGuard>,
      },
      {
        path: 'manifesting',
        element: <RoleGuard permission="MANAGE_MANIFEST" requireAuth={true} use404Fallback={true}><ManifestingPage /></RoleGuard>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ],
  },
]);
