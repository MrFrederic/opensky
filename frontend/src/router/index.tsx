import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import Profile from '@/pages/Profile';
import UserList from '@/pages/administration/UserList';
import AdminUserDetails from '@/pages/administration/AdminUserDetails';
import UserCreate from '@/pages/administration/UserCreate';
import DictionaryList from '@/pages/administration/DictionaryList';
import DictionaryEdit from '@/pages/administration/DictionaryEdit';
import { AdminOnly } from '@/components/auth/RoleGuard';

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
        path: 'admin/users',
        element: <AdminOnly><UserList /></AdminOnly>,
      },
      {
        path: 'admin/users/new',
        element: <AdminOnly><UserCreate /></AdminOnly>,
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
        path: 'admin/dictionaries',
        element: <AdminOnly><DictionaryList /></AdminOnly>,
      },
      {
        path: 'admin/dictionaries/:id',
        element: <AdminOnly><DictionaryEdit /></AdminOnly>,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ],
  },
]);
