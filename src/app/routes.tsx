import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { LateRecords } from "./pages/LateRecords";
import { Exemptions } from "./pages/Exemptions";
import { Absences } from "./pages/Absences";
import { Undertime } from "./pages/Undertime";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "lates", Component: LateRecords },
      { path: "exemptions", Component: Exemptions },
      { path: "absences", Component: Absences },
      { path: "undertime", Component: Undertime },
    ],
  },
]);