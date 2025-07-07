import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import UserList from '@/pages/administration/UserList';
import UserProfile from '@/pages/administration/UserProfile';
import UserCreate from '@/pages/administration/UserCreate';

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
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'admin/users',
        element: <UserList />,
      },
      {
        path: 'admin/users/new',
        element: <UserCreate />,
      },
      {
        path: 'admin/users/:id',
        element: <UserProfile />,
      },
    ],
  },
]);
