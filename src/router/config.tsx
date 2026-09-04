import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ModelsPage from "../pages/models/page";
import ModelDetailPage from "../pages/model-detail/page";
import AboutPage from "../pages/about/page";
import BoardPage from "../pages/board/page";
import BoardDetailPage from "../pages/board-detail/page";
import AdminPage from "../pages/admin/page";
import AdminEditorPage from "../pages/admin/editor";

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
    path: "/board",
    element: <BoardPage />,
  },
  {
    path: "/board/:slug",
    element: <BoardDetailPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "/admin/posts/:id",
    element: <AdminEditorPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
