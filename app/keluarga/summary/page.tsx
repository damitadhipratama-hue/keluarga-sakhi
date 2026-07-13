"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2, Plus, Save, X, Calendar, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

// Mapping Daftar Kategori untuk Dropdown
const LIST_KATEGORI = [
  "Makan",
  "Keperluan Lain",
  "Bensin",
  "Jajan",
  "Belanja Bulanan",
  "Kontrakan",
  "Entertain",
  "Internet",
  "Listrik",
  "IPL",
  "Laundry",
  "Keperluan Rumah",
  "Gaji",
  "Dividen",
  "Kudus",
  "Korea",
  "Rembang",
  "Sedekah",
  "Keperluan Anak",
  "Investasi",
  "Pajak"
];

interface MasterPlan {
  id?: number;
  date_plan: string;
  category: string;
  target: number;
  actual?: number;
  sisa?: number;
}

interface TransaksiForm {
  tanggal: string;
  kategori: string;
  jumlah: number;
}

export default function MasterPlanPage() {
  // State untuk data master plan dan transaksi form
  const [plans, setPlans] = useState<MasterPlan[]>([]);
  const [transaksiList, setTransaksiList] = useState<TransaksiForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Bulan (Format: YYYY-MM), default ke bulan berjalan saat ini
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  // State Form Input
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [datePlan, setDatePlan] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // State untuk inline editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDatePlan, setEditDatePlan] = useState("");

  // Fetch semua data saat halaman dimuat atau filter bulan berubah
  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data transaksi dari keluarga_form untuk kalkulasi 'actual'
      const resForm = await fetch("/api/keluarga_form");
      const dataForm = await resForm.json();
      const listTransaksi: TransaksiForm[] = dataForm.success ? dataForm.data : [];
      setTransaksiList(listTransaksi);

      // 2. Ambil data keluarga_master
      const resMaster = await fetch("/api/keluarga_master");
      const dataMaster = await resMaster.json();
      const listMaster: MasterPlan[] = dataMaster.success ? dataMaster.data : [];

      // Filter master plan berdasarkan bulan yang dipilih (match YYYY-MM)
      const filteredMaster = listMaster.filter((plan) =>
        plan.date_plan.startsWith(selectedMonth)
      );

      // 3. Hitung 'actual' secara dinamis berdasarkan kategori dan bulan di transaksi_form
      const processedPlans = filteredMaster.map((plan) => {
        const planMonth = plan.date_plan.substring(0, 7); // Ambil YYYY-MM

        // Jumlahkan pengeluaran/pemasukan yang memiliki kategori dan bulan yang sama
        const totalActual = listTransaksi
          .filter(
            (t) =>
              t.kategori.toLowerCase() === plan.category.toLowerCase() &&
              t.tanggal.startsWith(planMonth)
          )
          .reduce((sum, item) => sum + Number(item.jumlah), 0);

        const targetVal = Number(plan.target);
        return {
          ...plan,
          actual: totalActual,
          sisa: targetVal - totalActual,
        };
      });

      setPlans(processedPlans);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Tambah Data Baru (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !target || !datePlan) return alert("Mohon isi semua field!");

    try {
      const res = await fetch("/api/keluarga_master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_plan: datePlan,
          category,
          target: Number(target),
          actual: 0, // Nilai default, nantinya terhitung dinamis
        }),
      });

      if (res.ok) {
        setCategory("");
        setTarget("");
        fetchData();
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    }
  };

  // Handler: Edit Mode (Aktifkan inline edit)
  const startEdit = (plan: MasterPlan) => {
    if (!plan.id) return;
    setEditingId(plan.id);
    setEditCategory(plan.category);
    setEditTarget(plan.target.toString());
    setEditDatePlan(plan.date_plan);
  };

  // Handler: Simpan Perubahan (PUT)
  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch("/api/keluarga_master", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          date_plan: editDatePlan,
          category: editCategory,
          target: Number(editTarget),
        }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchData();
      }
    } catch (error) {
      console.error("Gagal memperbarui data:", error);
    }
  };

  // Handler: Hapus Data (DELETE)
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus plan ini?")) return;

    try {
      const res = await fetch(`/api/keluarga_master?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Gagal menghapus data:", error);
    }
  };

  // Helper Formatter Rupiah
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Pemisahan data pemasukan dan pengeluaran secara dinamis
  const pemasukanPlans = plans.filter(p => ["gaji", "dividen"].includes(p.category.toLowerCase()));
  const pengeluaranPlans = plans.filter(p => !["gaji", "dividen"].includes(p.category.toLowerCase()));

  // Fungsi untuk menghitung total baris bawah
  const hitungTotal = (listPlans: MasterPlan[]) => {
    return listPlans.reduce(
      (acc, curr) => {
        acc.target += Number(curr.target || 0);
        acc.actual += Number(curr.actual || 0);
        acc.sisa += Number(curr.sisa || 0);
        return acc;
      },
      { target: 0, actual: 0, sisa: 0 }
    );
  };

  const totalPemasukan = hitungTotal(pemasukanPlans);
  const totalPengeluaran = hitungTotal(pengeluaranPlans);

  // Komponen Helper Render Tabel agar tidak menulis ulang kode tabel UI yang sama berkali-kali
  const renderTableContent = (filteredPlans: MasterPlan[], totalData: { target: number; actual: number; sisa: number }) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#262626] text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-800">
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Actual (Form)</th>
              <th className="px-6 py-4">Sisa</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {filteredPlans.map((plan) => {
              const isEditing = editingId === plan.id;
              const sisaNilai = plan.sisa || 0;
              const isMinus = sisaNilai < 0;

              return (
                <tr key={plan.id} className="hover:bg-[#222222] transition-colors">
                  {/* Tanggal */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="date"
                        value={editDatePlan}
                        onChange={(e) => setEditDatePlan(e.target.value)}
                        className="bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm scheme-dark focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      new Date(plan.date_plan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    )}
                  </td>

                  {/* Kategori */}
                  <td className="px-6 py-4 font-medium">
                    {isEditing ? (
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer text-gray-200"
                      >
                        {LIST_KATEGORI.map((kat) => (
                          <option key={kat} value={kat} className="bg-[#262626]">
                            {kat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      plan.category
                    )}
                  </td>

                  {/* Target */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        className="bg-[#262626] border border-gray-700 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      formatRupiah(plan.target)
                    )}
                  </td>

                  {/* Actual */}
                  <td className="px-6 py-4 text-gray-300">
                    {formatRupiah(plan.actual || 0)}
                  </td>

                  {/* Sisa */}
                  <td className={`px-6 py-4 font-semibold whitespace-nowrap ${isMinus ? "text-red-500" : "text-emerald-500"}`}>
                    {formatRupiah(sisaNilai)}
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {isEditing ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => plan.id && handleUpdate(plan.id)}
                          className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 rounded-lg transition-colors"
                          title="Simpan"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-gray-700/40 text-gray-400 hover:bg-gray-700/60 rounded-lg transition-colors"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => startEdit(plan)}
                          className="p-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => plan.id && handleDelete(plan.id)}
                          className="p-1.5 bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* BARIS TOTAL PALING BAWAH */}
          <tfoot>
            <tr className="bg-[#262626]/60 border-t-2 border-gray-800 font-bold text-gray-200">
              <td colSpan={2} className="px-6 py-4 text-left">TOTAL AMOUNT</td>
              <td className="px-6 py-4 text-emerald-500">{formatRupiah(totalData.target)}</td>
              <td className="px-6 py-4 text-gray-200">{formatRupiah(totalData.actual)}</td>
              <td className={`px-6 py-4 ${totalData.sisa < 0 ? "text-red-500" : "text-emerald-500"}`}>
                {formatRupiah(totalData.sisa)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER & FILTER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Keluarga Master Plan</h1>
            <p className="text-gray-400 text-sm">Kelola target anggaran bulanan Anda di sini.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-[#1e1e1e] px-4 py-2 rounded-xl border border-gray-800">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-gray-100 outline-none cursor-pointer scheme-dark"
            />
          </div>
        </div>

        {/* FORM INPUT CARD */}
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> Tambah Plan Baru
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tanggal Plan</label>
              <input
                type="date"
                value={datePlan}
                onChange={(e) => setDatePlan(e.target.value)}
                className="w-full bg-[#262626] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors scheme-dark"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#262626] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none"
              >
                <option value="" disabled hidden>Pilih Kategori</option>
                {LIST_KATEGORI.map((kat) => (
                  <option key={kat} value={kat} className="bg-[#262626]">
                    {kat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Target Anggaran (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-[#262626] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Simpan Ke Plan
            </button>
          </form>
        </div>

        {/* UTAMA CONTAINER UNTUK DUA TABEL */}
        {loading ? (
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl p-10 text-center text-gray-400 shadow-xl">
            Memuat data plan...
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. TABEL PENGELUARAN (SEKARANG DI ATAS) */}
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-semibold">Daftar Pengeluaran Periode {selectedMonth}</h2>
              </div>
              {pengeluaranPlans.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Belum ada plan anggaran pengeluaran di bulan ini.</div>
              ) : (
                renderTableContent(pengeluaranPlans, totalPengeluaran)
              )}
            </div>

            {/* 2. TABEL PEMASUKAN (SEKARANG DI BAWAH) */}
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-gray-800 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold">Daftar Pemasukan Periode {selectedMonth}</h2>
              </div>
              {pemasukanPlans.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Belum ada plan pemasukan (Gaji / Dividen) di bulan ini.</div>
              ) : (
                renderTableContent(pemasukanPlans, totalPemasukan)
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}