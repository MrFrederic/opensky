import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import HomePage from '@/pages/public/HomePage';
import DashboardPage from '@/pages/public/DashboardPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import Profile from '@/pages/Profile';
import LogbookPage from '@/pages/Logbook';
import UserList from '@/pages/admin/user/UserList';
import AdminUserDetails from '@/pages/admin/user/UserEdit';
import DictionaryList from '@/pages/admin/config/DictionaryList';
import DictionaryEdit from '@/pages/admin/config/DictionaryEdit';
import JumpTypeList from '@/pages/admin/config/JumpTypeList';
import JumpTypeEdit from '@/pages/admin/config/JumpTypeEdit';
import AircraftList from '@/pages/admin/config/AircraftList';
import AircraftEdit from '@/pages/admin/config/AircraftEdit';
import ManifestingPage from '@/pages/admin/ManifestingPage';
import { AdminOnly, AuthRequired } from '@/components/auth/RoleGuard';

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
        element: <AdminOnly><UserList /></AdminOnly>,
      },
      {
        path: 'admin/users/new',
        element: <AdminOnly><AdminUserDetails /></AdminOnly>,
      },
      {
        path: 'admin/users/:id',
        element: <AdminOnly><AdminUserDetails /></AdminOnly>,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'logbook',
        element: <LogbookPage />,
      },
      {
        path: 'logbook',
        element: <AuthRequired><LogbookPage /></AuthRequired>,
      },
      {
        path: 'admin/dictionaries',
        element: <AdminOnly><DictionaryList /></AdminOnly>,
      },
      {
        path: 'admin/dictionaries/:id',
        element: <AdminOnly><DictionaryEdit /></AdminOnly>,
      },
      {
        path: 'admin/jump-types',
        element: <AdminOnly><JumpTypeList /></AdminOnly>,
      },
      {
        path: 'admin/jump-types/new',
        element: <AdminOnly><JumpTypeEdit /></AdminOnly>,
      },
      {
        path: 'admin/jump-types/:id',
        element: <AdminOnly><JumpTypeEdit /></AdminOnly>,
      },
      {
        path: 'admin/aircraft',
        element: <AdminOnly><AircraftList /></AdminOnly>,
      },
      {
        path: 'admin/aircraft/new',
        element: <AdminOnly><AircraftEdit /></AdminOnly>,
      },
      {
        path: 'admin/aircraft/:id',
        element: <AdminOnly><AircraftEdit /></AdminOnly>,
      },
      {
        path: 'manifesting',
        element: <AdminOnly><ManifestingPage /></AdminOnly>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ],
  },
]);
