import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import HomePage from '@/pages/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
]);
