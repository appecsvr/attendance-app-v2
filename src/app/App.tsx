import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AttendanceProvider } from "./context/AttendanceContext";

export default function App() {
  return (
    <AttendanceProvider>
      <RouterProvider router={router} />
    </AttendanceProvider>
  );
}