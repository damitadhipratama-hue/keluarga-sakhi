"use client";

// ADD THIS LINE to load Tailwind CSS
import "./globals.css"; 

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DevStatus = "dummy"; 

type MenuItem = {
  label: string;
  href?: string; 
  subItems?: { label: string; href: string; status?: DevStatus }[];
  status?: DevStatus; 
};

const getMenuTextColor = (status?: DevStatus, isSubMenu: boolean = false) => {
  switch (status) {
    case "dummy":
      return "text-zinc-600 hover:text-zinc-500 font-medium"; 
    default:
      return isSubMenu 
        ? "text-zinc-500 hover:text-[#00F0FF] font-medium" 
        : "text-zinc-400 hover:text-white font-medium"; 
  }
};

const menuData: Record<string, MenuItem[]> = {
  Keluarga: [
    { label: "Form Response", href: "/keluarga/form_response" },
    { label: "Summary View", href: "/keluarga/summary" },
    { label: "Dashboard Chart", href: "/keluarga/dashboard" },
    { label: "Laporan Tutup Buku", href: "/keluarga/form_tutup_buku" },
    { label: "Maintenance", href: "/keluarga/maintenance" },
  ],
  Perusahaan: [
    { label: "Form Response", href: "/perusahaan/form_response" },
    { label: "Maintenance", href: "/perusahaan/maintenance" },
    { label: "Dashboard", href: "/perusahaan/dashboard" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  
  const [activeMenu, setActiveMenu] = useState<string>("Keluarga");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Mobile drawer state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false); // Desktop toggle state
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    const storedLoginStatus = localStorage.getItem("isLoggedIn");
    const storedUserData = localStorage.getItem("currentUser");

    if (storedLoginStatus === "true" && storedUserData) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(storedUserData));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchTotalUsers = async () => {
        setUsersLoading(true);
        try {
          const response = await fetch("/api/users");
          if (response.ok) {
            const users = await response.json();
            setTotalUsers(users.length || 0);
          }
        } catch (error) {
          console.error("Gagal mengambil data user:", error);
        } finally {
          setUsersLoading(false);
        }
      };
      fetchTotalUsers();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    setExpandedMenu(null);
  }, [activeMenu]);

  const activeUser = currentUser ? {
    NickName: currentUser.name ? currentUser.name.split(" ")[0] : "User",
    Full_Name: currentUser.name,
    Level: currentUser.authority || "User",
    Phone: currentUser.phone || "-",
    Email: currentUser.email,
    ID_no: `UID-${currentUser.id}`,
  } : null;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const inputLogin = email.trim().toLowerCase();

    if (!inputLogin || !password) {
      setLoginError("Username/Email dan kata sandi wajib diisi.");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch("/api/users");
      const users = await response.json();

      if (!response.ok) {
        throw new Error(users.error || "Gagal terhubung ke server.");
      }

      const foundUser = users.find((u: any) => {
        const userDbEmail = u.email.toLowerCase();
        const userDbUsername = userDbEmail.split("@")[0]; 
        
        const isMatch = (inputLogin === userDbEmail || inputLogin === userDbUsername);
        return isMatch && u.password === password;
      });

      if (foundUser) {
        setIsLoggedIn(true);
        setCurrentUser(foundUser);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("currentUser", JSON.stringify(foundUser));
        setTotalUsers(users.length); 
        
        router.push("/keluarga/form_response");
      } else {
        setLoginError("Username/Email atau kata sandi salah.");
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Terjadi kesalahan pada sistem.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleBypassLogin = () => {
    const mockDevAdmin = {
      id: "999-DEV",
      name: "Developer Admin",
      email: "dev.admin@teriothq.local",
      authority: "Admin", 
      phone: "0812-DEV-MODE",
    };

    setIsLoggedIn(true);
    setCurrentUser(mockDevAdmin);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(mockDevAdmin));
    setTotalUsers(1); 
    
    router.push("/keluarga/form_response");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    
    setEmail("");
    setPassword("");
    setActiveMenu("Keluarga");
    setIsSidebarOpen(false);
    router.push("/");
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setRegisterSuccess(false);
    setRegisterError(null);
    setRegisterForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterError(null);

    if (!registerForm.name.trim() || !registerForm.email.trim() || !registerForm.password) {
      setRegisterError("Nama, email, dan kata sandi wajib diisi.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    setRegisterLoading(true);

    try {
      const { confirmPassword, ...payloadData } = registerForm;
      const payload = {
        ...payloadData,
        authority: "User",
      };

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal melakukan registrasi.");
      }

      setRegisterSuccess(true);
      setRegisterForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : "Terjadi kesalahan pada server.");
    } finally {
      setRegisterLoading(false);
    }
  };

  const renderSidebarMenuItems = () => {
    const currentItems = menuData[activeMenu] || [];
    if (currentItems.length === 0) {
      return <p className="text-zinc-600 text-xs italic px-4">Tidak ada menu.</p>;
    }

    return currentItems.map((item, idx) => (
      <div key={idx} className="space-y-1">
        {item.href ? (
          <Link
            href={item.href}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-xs tracking-wide transition-all ${getMenuTextColor(item.status, false)} hover:bg-white/[0.03]`}
          >
            <span>{item.label}</span>
          </Link>
        ) : (
          <div>
            <button
              onClick={() => setExpandedMenu(expandedMenu === item.label ? null : item.label)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs tracking-wide text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-all"
            >
              <span>{item.label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform duration-200 ${expandedMenu === item.label ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {expandedMenu === item.label && item.subItems && (
              <div className="mt-1 ml-4 pl-2 border-l border-white/[0.05] space-y-1">
                {item.subItems.map((sub, sIdx) => (
                  <Link
                    key={sIdx}
                    href={sub.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-[11px] rounded-md transition-all ${getMenuTextColor(sub.status, true)} hover:bg-white/[0.02]`}
                  >
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <html lang="en">
      <head>
  <link 
    rel="icon" 
    href='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" x="20" font-family="sans-serif" font-weight="bold" font-size="80" fill="%2300F0FF">$</text></svg>' 
  />
</head>
      <body>
        {!isMounted ? (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <span className="text-[#00F0FF] animate-pulse text-sm font-bold tracking-widest uppercase">Memuat Sistem...</span>
          </div>
        ) : !isLoggedIn ? (
          <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#00F0FF]/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="w-full max-w-md bg-[#09090b]/80 backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-10">
              <div className="text-center mb-8">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tighter bg-gradient-to-r from-[#00F0FF] to-[#0066FF] bg-clip-text text-transparent drop-shadow-sm mb-2">
                  KELUARGA SAKHI
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400">Silakan masuk untuk mengakses sistem.</p>
              </div>

              {loginError && (
                <div className="mb-6 flex items-center gap-3 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 sm:p-4 text-xs sm:text-sm text-rose-400 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:gap-5">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Username atau Email</span>
                  <input
                    type="text" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all placeholder:text-zinc-600"
                    placeholder="Username atau email Anda"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Kata Sandi</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all placeholder:text-zinc-600"
                    placeholder="••••••••"
                  />
                </label>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full rounded-lg bg-gradient-to-r from-[#00F0FF] to-[#0066FF] px-4 py-3 text-sm font-bold text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center uppercase tracking-widest"
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Memeriksa...
                      </span>
                    ) : (
                      "Masuk"
                    )}
                  </button>

                  {process.env.NODE_ENV === "development" && (
                    <button
                      type="button"
                      onClick={handleBypassLogin}
                      className="w-full rounded-lg bg-purple-600/20 border border-purple-500/40 px-4 py-2 text-xs font-bold text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 transition-all flex justify-center items-center uppercase tracking-wider"
                    >
                      ⚡ Bypass Dev Login (Admin)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="w-full rounded-lg bg-orange-500 px-3 py-3 sm:py-2 text-xs font-medium text-white hover:bg-orange-600 transition-all flex justify-center items-center shadow-sm"
                  >
                    Belum punya akun? Daftar Sekarang
                  </button>
                </div>
              </form>
            </div>

            {/* MODAL REGISTER */}
            {isRegisterModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md relative max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-2xl bg-[#09090b] border border-white/[0.08] shadow-2xl">
                  
                  <button 
                    onClick={closeRegisterModal}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/[0.1] z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 11-1.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {registerSuccess ? (
                    <div className="p-6 sm:p-8 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30 mt-4">
                        <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Registrasi Berhasil!</h2>
                        <p className="text-zinc-400 text-xs sm:text-sm">
                          Akun Anda telah berhasil dibuat sebagai User. Silakan masuk menggunakan email dan kata sandi yang telah Anda daftarkan.
                        </p>
                      </div>
                      <button
                        onClick={closeRegisterModal}
                        className="mt-4 w-full rounded-lg bg-white text-black px-4 py-3 text-sm font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Tutup & Menuju Halaman Masuk
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-300">
                      <div className="flex flex-col gap-2 text-center mt-2">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Buat Akun Baru</h1>
                        <p className="text-xs sm:text-sm text-zinc-400">
                          Lengkapi data di bawah ini untuk mendaftar.
                        </p>
                      </div>

                      {registerError && (
                        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 sm:p-4 text-xs sm:text-sm text-rose-400">
                          {registerError}
                        </div>
                      )}

                      <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Nama Lengkap <span className="text-rose-500">*</span></span>
                          <input
                            type="text"
                            required
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                            className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                            placeholder="Contoh: Budi Santoso"
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Alamat Email <span className="text-rose-500">*</span></span>
                          <input
                            type="email"
                            required
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                            className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                            placeholder="contoh@email.com"
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Nomor Telepon</span>
                          <input
                            type="tel"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                            className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                            placeholder="0812xxxxxxxx"
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Kata Sandi <span className="text-rose-500">*</span></span>
                          <input
                            type="password"
                            required
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                            className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                            placeholder="••••••••"
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-sm">
                          <span className="font-bold text-zinc-300 uppercase tracking-widest text-[10px]">Konfirmasi Kata Sandi <span className="text-rose-500">*</span></span>
                          <input
                            type="password"
                            required
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                            className="rounded-lg border border-white/[0.1] bg-black/50 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                            placeholder="••••••••"
                          />
                        </label>

                        <button
                          type="submit"
                          disabled={registerLoading}
                          className="mt-2 w-full rounded-lg bg-white text-black px-4 py-3 text-sm font-bold hover:bg-zinc-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center"
                        >
                          {registerLoading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Memproses...
                            </span>
                          ) : (
                            "Daftar Sekarang"
                          )}
                        </button>
                      </form>

                      <p className="text-center text-xs sm:text-sm text-zinc-400 mt-2">
                        Sudah punya akun?{" "}
                        <button onClick={closeRegisterModal} className="font-bold text-white hover:underline">
                          Masuk di sini
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* KONDISI 2: JIKA SUDAH LOGIN -> TAMPILKAN LAYOUT UTAMA */
          <div className="min-h-screen bg-[#050505] text-white text-[13px] sm:text-sm flex flex-col font-sans overflow-x-hidden">
            {/* HEADER */}
            <header className="sticky top-0 z-30 w-full border-b border-white/[0.05] bg-[#050505]/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between gap-3">
                
                <div className="flex items-center gap-3">
                  {/* Hamburger Menu (Mobile Only) */}
                  <button 
                    className="md:hidden text-zinc-400 hover:text-white transition-colors p-1"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </button>

                  {/* Desktop Sidebar Toggle Button */}
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden md:flex text-zinc-400 hover:text-white transition-colors p-1.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-md"
                    title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                    </svg>
                  </button>

                  {/* Logo / Title */}
                  <h1 className="text-sm md:text-base lg:text-lg font-extrabold tracking-tighter bg-gradient-to-r from-[#00F0FF] to-[#0066FF] bg-clip-text text-transparent whitespace-nowrap shrink-0 drop-shadow-sm">
                    SAKHI's FAMILY
                  </h1>
                </div>

                {/* Navigation (Scrollable on Mobile) */}
                <nav className="flex-1 flex items-center justify-start gap-3 md:gap-6 lg:gap-8 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-3 sm:px-4">
                  {Object.keys(menuData)
                    .filter((menu) => {
                      if (menu === "HSE" || menu === "USER") {
                        return currentUser?.authority === "Admin";
                      }
                      return true;
                    })
                    .map((menu) => (
                      <button
                        key={menu}
                        onClick={() => setActiveMenu(menu)}
                        className={`transition-all duration-300 whitespace-nowrap py-2 ${
                          activeMenu === menu
                            ? "text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                            : "text-zinc-400 hover:text-[#00F0FF] hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                        }`}
                      >
                        {menu}
                      </button>
                    ))}
                </nav>

                {/* User Profile Dropdown */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative group">
                    {!activeUser ? (
                      <span className="text-zinc-600 animate-pulse text-xs">Loading...</span>
                    ) : (
                      <div className="relative">
                        {/* Profile Button */}
                        <div className="flex items-center gap-2 md:gap-3 bg-white/[0.02] backdrop-blur-md border border-white/[0.05] hover:border-[#00F0FF]/50 hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(0,240,255,0.15)] transition-all duration-300 ease-in-out px-2 md:px-3 py-1.5 rounded-full cursor-pointer">
                          <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#00F0FF] to-[#7000FF] text-white font-bold text-[9px] sm:text-[10px] md:text-xs shadow-[0_0_10px_rgba(0,240,255,0.3)] uppercase">
                            {activeUser.NickName.charAt(0)}
                          </div>
                          <div className="text-left leading-tight pr-1 md:pr-2 hidden sm:block">
                            <div className="text-[10px] sm:text-xs font-bold text-zinc-200 tracking-wide capitalize">
                              {activeUser.NickName}
                            </div>
                            <div className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest">
                              {activeUser.Level}
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Card */}
                        <div className="absolute right-0 mt-3 w-56 md:w-64 bg-[#09090b]/95 backdrop-blur-xl text-zinc-300 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/[0.08] opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                          <div className="p-4 md:p-5 space-y-3 text-xs font-medium">
                            <div className="flex justify-between items-center border-b border-white/[0.05] pb-2 mb-2">
                              <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Profile Info</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Name</span>
                              <span className="text-zinc-200 font-semibold">{activeUser.Full_Name}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Email</span>
                              <span className="text-zinc-200 font-semibold truncate">{activeUser.Email}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Phone</span>
                              <span className="text-zinc-200 font-semibold">{activeUser.Phone}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">ID</span>
                              <span className="text-zinc-200 font-semibold">{activeUser.ID_no}</span>
                            </div>
                          </div>
                          <div className="border-t border-white/[0.05] bg-white/[0.02]">
                            <button
                              onClick={handleLogout}
                              className="w-full text-left text-xs text-rose-400 hover:bg-rose-500/10 px-5 py-3 transition-colors font-semibold uppercase tracking-wider"
                            >
                              Logout Account
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex relative w-full h-[calc(100vh-4rem)] overflow-hidden">
              
              {/* 1. MOBILE SIDEBAR (Drawer Overlay) */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
              <aside className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#09090b] border-r border-white/[0.05] p-3 sm:p-4 flex flex-col justify-between transition-transform duration-300 md:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="space-y-5 overflow-y-auto pr-1">
                  <div>
                    <p className="px-3 sm:px-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{activeMenu} Menu</p>
                    <nav className="space-y-1">{renderSidebarMenuItems()}</nav>
                  </div>
                </div>
              
              </aside>

              {/* 2. DESKTOP SIDEBAR (Collapsible Static Layout) */}
              <aside className={`hidden md:flex flex-col justify-between bg-[#09090b]/40 border-r border-white/[0.05] p-4 h-full shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 p-0 border-r-0 opacity-0 pointer-events-none" : "w-60"}`}>
                <div className="space-y-5 overflow-y-auto pr-1">
                  {!isSidebarCollapsed && (
                    <div>
                      <p className="px-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{activeMenu} Menu</p>
                      <nav className="space-y-1">{renderSidebarMenuItems()}</nav>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <div className="pt-4 border-t border-white/[0.05] text-[9px] sm:text-[10px] text-zinc-600 px-4 whitespace-nowrap">
                    
                  </div>
                )}
              </aside>

              {/* 3. DYNAMIC CONTENT INNER BODY */}
              <main className="flex-1 h-full overflow-y-auto bg-[#050505] p-3 sm:p-4 md:p-5 lg:p-6">
                <div className="max-w-full mx-auto w-full animate-in fade-in duration-300">
                  {children}
                </div>
              </main>

            </div>
          </div>
        )}
      </body>
    </html>
  );
}