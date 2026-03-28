import { createBrowserRouter } from 'react-router-dom';
import { ArchivePage } from './pages/ArchivePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ArchivePage />,
  },
]);
