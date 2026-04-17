import { useState } from "react";
import { Navigate } from "react-router";
import { LogIn, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { signIn, user, loading, configError } = useAuth();

  const [email, setEmail] = useState("app@attendance.local");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorText("");
    setIsSubmitting(true);

    const result = await signIn(email, password);

    if (!result.success) {
      setErrorText(result.message);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-3xl p-8">

        {/* HEADER WITH LOGO */}
        <div className="flex items-center gap-3 mb-8">
<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center">
  <img
    src="/Watts-logo.png"
    alt="Watts Logo"
    className="w-8 h-8 object-contain"
  />
</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              WATTS App TimeCore
            </h1>
            <p className="text-sm text-slate-500">
              HR Attendance System Login
            </p>
          </div>
        </div>

        {/* CONFIG ERROR */}
        {configError ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <div>{configError}</div>
            </div>
          </div>
        ) : null}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Email
            </label>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="app@attendance.local">APP</option>
              <option value="wais@attendance.local">WAIS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorText ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorText}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !!configError}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-4 py-3 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}