import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AttendanceProvider } from "./context/AttendanceContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <RouterProvider router={router} />
      </AttendanceProvider>
    </AuthProvider>
  );
}