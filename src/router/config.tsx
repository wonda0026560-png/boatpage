import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ModelsPage from "../pages/models/page";
import ModelDetailPage from "../pages/model-detail/page";
import AboutPage from "../pages/about/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/models",
    element: <ModelsPage />,
  },
  {
    path: "/models/:slug",
    element: <ModelDetailPage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
