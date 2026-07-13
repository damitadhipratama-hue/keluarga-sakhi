import React from "react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[70vh] text-center animate-in fade-in zoom-in-95 duration-500">
      {/* Icon / Logo Placeholder */}
      <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-[#00F0FF]/10 to-[#0066FF]/10 flex items-center justify-center border border-[#00F0FF]/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
        <span className="text-4xl">👋</span>
      </div>
      
      {/* Welcome Text */}
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-white mb-4">
        Selamat Datang di <span className="bg-gradient-to-r from-[#00F0FF] to-[#0066FF] bg-clip-text text-transparent drop-shadow-sm">TERIOT V.1</span>
      </h1>
      
      <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base leading-relaxed mb-8">
        Sistem monitoring produksi dan manajemen terintegrasi. Silakan pilih menu pada navigasi di atas atau sidebar untuk memulai aktivitas Anda.
      </p>

      {/* Optional: Quick Action Button */}
      <div className="flex gap-4">
        <div className="px-6 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Pilih Menu Untuk Memulai
        </div>
      </div>
    </div>
  );
}