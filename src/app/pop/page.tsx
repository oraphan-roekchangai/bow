"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [activeTab, setActiveTab] = useState("LOGIN");
  const router = useRouter();
  
  // Form data state
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });
  
  const [signupData, setSignupData] = useState({
    username: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    licensePlate: ""
  });
  
  // Error state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Success message
  const [successMessage, setSuccessMessage] = useState("");

  const validateLoginForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!loginData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!loginData.password.trim()) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!signupData.username.trim()) {
      newErrors.username = "Username is required";
    }
    
    if (!signupData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!signupData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!signupData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(signupData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be exactly 10 digits";
    }
    
    if (!signupData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    } else if (signupData.password.length > 20) {
      newErrors.password = "Password must not exceed 20 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error || 'Login failed' });
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ form: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: signupData.username,
          fullName: signupData.fullName,
          email: signupData.email,
          phoneNumber: signupData.phoneNumber,
          password: signupData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.error || 'Signup failed' });
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');

    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ form: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage('');
    setErrors({});
    
    let isValid = false;
    
    if (activeTab === "LOGIN") {
      isValid = validateLoginForm();
      if (isValid) {
        await handleLogin();
      }
    } else {
      isValid = validateSignupForm();
      if (isValid) {
        await handleSignup();
      }
    }
  };

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSignupInputChange = (field: string, value: string) => {
    // For phone number, only allow numeric characters
    if (field === "phoneNumber") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setSignupData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setSignupData(prev => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Clear errors when switching tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setErrors({});
    setSuccessMessage('');
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
          

          {/* Tabs */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-sm">
              <button
                onClick={() => handleTabChange("LOGIN")}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
                  activeTab === "LOGIN"
                    ? "bg-blue-500 text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => handleTabChange("SIGNUP")}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
                  activeTab === "SIGNUP"
                    ? "bg-blue-500 text-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                SIGN UP
              </button>
            </div>
          </div>
<h1 className="mb-8 text-center text-4xl font-extrabold tracking-wide">
            {activeTab === "LOGIN" ? "SIGN IN" : "SIGN UP"}
          </h1>
          
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 rounded-lg bg-green-100 border border-green-400 p-3 text-center">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Form Error Message */}
          {errors.form && (
            <div className="mb-4 rounded-lg bg-red-100 border border-red-400 p-3 text-center">
              <p className="text-sm font-medium text-red-800">{errors.form}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {activeTab === "LOGIN" ? (
              <>
                {/* Login Form */}
                {/* Username */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={loginData.username}
                    onChange={(e) => handleLoginInputChange("username", e.target.value)}
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
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                  </div>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={loginData.password}
                    onChange={(e) => handleLoginInputChange("password", e.target.value)}
                    className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                      errors.password ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 py-3 text-lg font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Sign Up Form */}
                {/* Username */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={signupData.username}
                    onChange={(e) => handleSignupInputChange("username", e.target.value)}
                    className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                      errors.username ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>
                {/* Full Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.fullName}
                    onChange={(e) => handleSignupInputChange("fullName", e.target.value)}
                    className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                      errors.fullName ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => handleSignupInputChange("email", e.target.value)}
                    className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                      errors.email ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter your phone number"
                    value={signupData.phoneNumber}
                    onChange={(e) => handleSignupInputChange("phoneNumber", e.target.value)}
                    className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                      errors.phoneNumber ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={signupData.password}
                    onChange={(e) => handleSignupInputChange("password", e.target.value)}
                    className={`w-full rounded-md border p-3 text-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2 ${
                      errors.password ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 py-3 text-lg font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-blue-700 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing up...
                    </span>
                  ) : (
                    "Sign up"
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}