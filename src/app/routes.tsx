import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { LateRecords } from "./pages/LateRecords";
import { Exemptions } from "./pages/Exemptions";
import Absences from "./pages/Absences";
import { Undertime } from "./pages/Undertime";
import EmployeesPage from "./pages/EmployeesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "employees", Component: EmployeesPage },
      { path: "lates", Component: LateRecords },
      { path: "exemptions", Component: Exemptions },
      { path: "absences", Component: Absences },
      { path: "undertime", Component: Undertime },
    ],
  },
]);