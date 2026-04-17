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
    <div
      className="relative min-h-screen overflow-hidden bg-[#edf2f8]"
      style={{
        backgroundImage: "url('/Designer.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center right",
      }}
    >
      {/* lighter left overlay only for login readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#edf2f8]/82 via-[#edf2f8]/40 to-transparent" />
      <div className="absolute inset-0 bg-white/5" />

      {/* soft light effects */}
      <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-blue-200/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-indigo-200/15 blur-3xl" />

      {/* login card */}
      <div className="relative z-10 flex min-h-screen items-center justify-start px-6 py-10 lg:px-24">
        <div className="w-full max-w-md rounded-[30px] border border-white/70 bg-white/88 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:p-10">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <img
                src="/Watts-logo.png"
                alt="Watts Logo"
                className="h-12 w-12 object-contain"
              />
            </div>

            <div>
              <h1 className="text-[22px] font-extrabold leading-tight text-slate-900">
                WATTS App
                <br />
                TimeCore
              </h1>
              <p className="text-sm text-slate-500">
                HR Attendance System Login
              </p>
            </div>
          </div>

          {configError ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <div>{configError}</div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Email
              </label>
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="app@attendance.local">APP</option>
                <option value="wais@attendance.local">WAIS</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            {errorText ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorText}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !!configError}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}