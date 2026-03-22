import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Spinner } from "@shared/components/ui/Spinner";

const CatalogPage = lazy(() => import("../pages/CatalogPage"));
const BookingPage = lazy(() => import("../pages/BookingPage"));

const router = createBrowserRouter([
  { path: "/", element: <CatalogPage /> },
  { path: "/concerts/:id", element: <BookingPage /> },
]);

export const AppRouter = () => (
  <Suspense fallback={<Spinner />}>
    <RouterProvider router={router} />
  </Suspense>
);
