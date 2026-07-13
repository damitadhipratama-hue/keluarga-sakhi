"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Calendar, DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";

interface FormItem {
  id: number;
  timestamp?: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
  kategori: string;
  keterangan: string;
}

interface MasterPlanItem {
  id: number;
  date_plan: string; // YYYY-MM-DD atau YYYY-MM
  category: string;
  target?: number;        
  target_budget?: number; 
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF19A3", "#19FFD8"];

export default function DashboardPage() {
  const [formData, setFormData] = useState<FormItem[]>([]);
  const [masterData, setMasterData] = useState<MasterPlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State
  const [selectedMonthMaster, setSelectedMonthMaster] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7); // Default ke "YYYY-MM" bulan ini
  });
  const [selectedMonthPie, setSelectedMonthPie] = useState<string>("ALL");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [resForm, resMaster] = await Promise.all([
          fetch("/api/keluarga_form"),
          fetch("/api/keluarga_master")
        ]);

        const resultForm = await resForm.json();
        const resultMaster = await resMaster.json();

        if (resultForm.success) setFormData(resultForm.data || []);
        if (resultMaster.success) setMasterData(resultMaster.data || []);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper pembeda Pemasukan vs Pengeluaran
  const isPemasukan = (kategori: string) => 
    ["gaji", "dividen"].includes(kategori.toLowerCase());

  // =========================================================================
  // LOGIKA DATA 1: Bar Chart Target vs Actual
  // =========================================================================
  const getTargetVsActualData = () => {
    const activePlans = masterData.filter(item => item.date_plan && item.date_plan.startsWith(selectedMonthMaster));
    
    const activeTransactions = formData.filter(item => 
      item.tanggal && item.tanggal.startsWith(selectedMonthMaster) && !isPemasukan(item.kategori)
    );

    const categoriesInPlan = Array.from(new Set(activePlans.map(p => p.category).filter(Boolean)));
    
    return categoriesInPlan.map(cat => {
      const planItem = activePlans.find(p => p.category === cat);
      const target = planItem ? Number(planItem.target ?? planItem.target_budget ?? 0) : 0;
      
      const actual = activeTransactions
        .filter(t => t.kategori === cat)
        .reduce((sum, t) => sum + Number(t.jumlah || 0), 0);

      return {
        kategori: cat,
        Target: target,
        Aktual: actual
      };
    });
  };

  // =========================================================================
  // LOGIKA DATA 2: Stacked Bar Chart - Pengeluaran & Pemasukan per Bulan
  // =========================================================================
  const getYearlyStackedData = () => {
    const monthlyMap: { [key: string]: { namaBulan: string; Pemasukan: number; Pengeluaran: number } } = {};
    
    formData.forEach(item => {
      if (!item.tanggal) return;
      const monthKey = item.tanggal.substring(0, 7);
      if (!monthlyMap[monthKey]) {
        const [year, month] = monthKey.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        const namaBulan = dateObj.toLocaleString("id-ID", { month: "short", year: "2-digit" });
        
        monthlyMap[monthKey] = { namaBulan, Pemasukan: 0, Pengeluaran: 0 };
      }

      if (isPemasukan(item.kategori)) {
        monthlyMap[monthKey].Pemasukan += Number(item.jumlah || 0);
      } else {
        monthlyMap[monthKey].Pengeluaran += Number(item.jumlah || 0);
      }
    });

    return Object.keys(monthlyMap)
      .sort()
      .map(key => monthlyMap[key]);
  };

  // =========================================================================
  // LOGIKA DATA 3: Pie Chart - Distribusi Pengeluaran Berdasarkan Kategori
  // =========================================================================
  const getPieCategoryData = () => {
    const filteredTx = selectedMonthPie === "ALL" 
      ? formData 
      : formData.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonthPie));

    const pengeluaranOnly = filteredTx.filter(item => !isPemasukan(item.kategori));

    const categoryMap: { [key: string]: number } = {};
    pengeluaranOnly.forEach(item => {
      categoryMap[item.kategori] = (categoryMap[item.kategori] || 0) + Number(item.jumlah || 0);
    });

    return Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat]
    }));
  };

  const getUniqueMonthsList = () => {
    const monthsFromForm = formData.map(item => item.tanggal ? item.tanggal.substring(0, 7) : "");
    const monthsFromMaster = masterData.map(item => item.date_plan ? item.date_plan.substring(0, 7) : "");
    
    const combined = [...monthsFromForm, ...monthsFromMaster].filter(Boolean);
    return Array.from(new Set(combined)).sort((a, b) => b.localeCompare(a));
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-zinc-400 flex items-center justify-center text-xs animate-pulse">
        Membuat visualisasi grafik finansial...
      </div>
    );
  }

  const targetVsActualData = getTargetVsActualData();
  const yearlyStackedData = getYearlyStackedData();
  const pieCategoryData = getPieCategoryData();
  const uniqueMonths = getUniqueMonthsList();

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] p-4 font-sans w-full space-y-6">
      
      {/* HEADER DASHBOARD */}
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-lg font-bold tracking-wide uppercase text-gray-200">
          DASHBOARD ANALISIS KELUARGA
        </h1>
        <p className="text-zinc-500 text-[11px] mt-0.5">
          Real-time visualisasi target anggaran, akumulasi berkala, dan struktur pengeluaran.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: BAR CHART TARGET (BIRU) VS ACTUAL (HIJAU) */}
        <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-zinc-800 p-4 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Target vs Aktual Anggaran Pengeluaran
              </h2>
            </div>
            
            <select
              value={selectedMonthMaster}
              onChange={(e) => setSelectedMonthMaster(e.target.value)}
              className="bg-[#242424] border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-[11px] outline-none cursor-pointer"
            >
              {uniqueMonths.length === 0 ? (
                <option value={selectedMonthMaster}>{selectedMonthMaster}</option>
              ) : (
                uniqueMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))
              )}
            </select>
          </div>

          <div className="w-full h-[280px] text-[11px]">
            {targetVsActualData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 italic">
                Tidak ada rencana master anggaran (plan) yang cocok pada periode {selectedMonthMaster}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={targetVsActualData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="kategori" stroke="#71717a" />
                  <YAxis stroke="#71717a" tickFormatter={(v: number) => `${v / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#3f3f46" }}
                    itemStyle={{ textTransform: "capitalize" }}
                    formatter={(value: any) => [formatRupiah(value), ""]}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  {/* WARNA DIUBAH DI SINI: Target = Biru, Aktual = Hijau */}
                  <Bar dataKey="Target" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Aktual" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CARD 3: PIE CARD DISTRIBUSI KATEGORI */}
        <div className="bg-[#1a1a1a] rounded-xl border border-zinc-800 p-4 shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                Distribusi Kategori
              </h2>
            </div>

            <select
              value={selectedMonthPie}
              onChange={(e) => setSelectedMonthPie(e.target.value)}
              className="bg-[#242424] border border-zinc-700 text-zinc-200 rounded px-2 py-1 text-[11px] outline-none cursor-pointer"
            >
              <option value="ALL">Semua Periode</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="w-full h-[220px] relative text-[11px]">
            {pieCategoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 italic">
                Tidak ada data transaksi.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#3f3f46" }}
                    formatter={(value: any) => [formatRupiah(value), "Total"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="max-h-[80px] overflow-y-auto mt-2 space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 text-[11px]">
            {pieCategoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-mono text-zinc-300">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRID BAWAH: CARD GRAPH 2 (STACKED BAR CHART ACUMULATION) */}
      <div className="w-full bg-[#1a1a1a] rounded-xl border border-zinc-800 p-4 shadow-xl">
        <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Arus Kas Pemasukan & Pengeluaran Berkala (Per Bulan)
          </h2>
        </div>

        <div className="w-full h-[320px] text-[11px]">
          {yearlyStackedData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 italic">
              Data transaksi kosong.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyStackedData} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="namaBulan" stroke="#71717a" />
                <YAxis stroke="#71717a" tickFormatter={(v: number) => `${v / 1000000}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#3f3f46" }}
                  formatter={(value: any) => [formatRupiah(value), ""]}
                />
                <Legend />
                <Bar dataKey="Pemasukan" stackId="flow" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pengeluaran" stackId="flow" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}