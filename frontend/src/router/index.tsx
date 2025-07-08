import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import UserList from '@/pages/administration/UserList';
import UserProfile from '@/pages/administration/UserProfile';
import UserCreate from '@/pages/administration/UserCreate';
import DictionaryList from '@/pages/administration/DictionaryList';
import DictionaryEdit from '@/pages/administration/DictionaryEdit';

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
      {
        path: 'profile',
        element: <UserProfile />,
      },
      {
        path: 'admin/dictionaries',
        element: <DictionaryList />,
      },
      {
        path: 'admin/dictionaries/:id',
        element: <DictionaryEdit />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      }
    ],
  },
]);
