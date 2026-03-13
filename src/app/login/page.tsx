"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: { [key: string]: string } = {};
    if (!loginData.username.trim()) e.username = "Username is required";
    if (!loginData.password.trim()) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrors({});
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.error || "Login failed" });
        return;
      }
      router.push("/dashboard");
    } catch {
      setErrors({ form: "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 grid md:grid-cols-2">
      {/* Left: Image */}
      <div className="relative hidden md:block p-3">
        <div className="h-[calc(100vh-24px)] w-full overflow-hidden rounded-lg ring-2 ring-blue-400">
          <Image
            src="/raban-haaijk-wftNpcjCHT4-unsplash.jpg"
            alt="Parking lot"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="mb-8 text-center text-4xl font-extrabold tracking-wide">
            SIGN IN
          </h1>

          {errors.form && (
            <div className="mb-4 rounded-lg bg-red-100 border border-red-400 p-3 text-center">
              <p className="text-sm font-medium text-red-800">{errors.form}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            {/* Username */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="Enter your username"
                value={loginData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                  errors.username ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                }`}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                  errors.password ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 py-3 text-lg font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
