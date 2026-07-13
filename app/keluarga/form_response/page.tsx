"use client";

import { useState, useEffect } from "react";
import { ArrowDownCircle, ArrowUpCircle, Calendar, Plus } from "lucide-react";

interface FormSummaryItem {
  id?: number;
  timestamp?: string;
  tanggal: string;
  jumlah: number;
  kategori: string;
  keterangan: string;
}

interface MasterPlanItem {
  id: number;
  date_plan: string;
  category: string;
}

export default function KeluargaFormPage() {
  const [data, setData] = useState<FormSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // State untuk menampung referensi kategori dari keluarga_master
  const [masterCategories, setMasterCategories] = useState<string[]>([]);

  // Form State - default tanggal ke hari ini (YYYY-MM-DD)
  const [tanggal, setTanggal] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [jumlah, setJumlah] = useState<number | string>("");
  const [kategori, setKategori] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");

  // Fetch data dari API utama
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/keluarga_form");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch referensi kategori dari master plan berdasarkan bulan dari state `tanggal`
  const fetchMasterCategories = async (currentDate: string) => {
    if (!currentDate) return;
    const targetMonth = currentDate.substring(0, 7); // Ambil YYYY-MM
    try {
      const response = await fetch("/api/keluarga_master");
      const result = await response.json();
      if (result.success) {
        const listMaster: MasterPlanItem[] = result.data;
        // Filter kategori yang match dengan bulan yang sama
        const filteredCategories = listMaster
          .filter((item) => item.date_plan.startsWith(targetMonth))
          .map((item) => item.category);

        // Hilangkan duplikasi jika ada kategori yang sama di bulan tersebut
        const uniqueCategories = Array.from(new Set(filteredCategories));
        setMasterCategories(uniqueCategories);

        // Jika kategori saat ini kosong atau tidak ada di dalam list yang baru, set ke item pertama
        if (uniqueCategories.length > 0 && !uniqueCategories.includes(kategori)) {
          setKategori(uniqueCategories[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch master categories:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Setiap kali tanggal berubah, fetch ulang kategori referensi yang tersedia di bulan tersebut
  useEffect(() => {
    fetchMasterCategories(tanggal);
  }, [tanggal]);

  // Buka modal untuk Add New
  const handleAddNewClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditingId(null);
    setTanggal(today);
    setJumlah("");
    setKeterangan("");
    setIsModalOpen(true);
  };

  // Buka modal untuk Edit Data
  const handleEditClick = (item: FormSummaryItem) => {
    if (!item.id) return;
    setEditingId(item.id);
    setTanggal(item.tanggal);
    setJumlah(item.jumlah);
    setKategori(item.kategori);
    setKeterangan(item.keterangan || "");
    setIsModalOpen(true);
  };

  // Handle Delete Data
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    try {
      const response = await fetch(`/api/keluarga_form?id=${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchData();
      } else {
        alert(result.error || "Gagal menghapus data");
      }
    } catch (error) {
      console.error("Failed to delete data:", error);
    }
  };

  // Handle Submit Form (POST atau PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori) return alert("Kategori belum tersedia atau belum dipilih untuk bulan ini!");

    const url = "/api/keluarga_form";
    const method = editingId ? "PUT" : "POST";
    const bodyData = editingId
      ? { id: editingId, tanggal, jumlah: Number(jumlah), kategori, keterangan }
      : { tanggal, jumlah: Number(jumlah), kategori, keterangan };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();
      if (result.success) {
        const today = new Date().toISOString().split("T")[0];
        setTanggal(today);
        setJumlah("");
        setKeterangan("");
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
      } else {
        alert(result.error || "Gagal menyimpan data");
      }
    } catch (error) {
      console.error("Failed to submit data:", error);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return date.toLocaleString("id-ID", { hour12: false });
  };

  // Klasifikasi & Filter Sort: Latest to Old Berdasarkan Column Timestamp
  const dataPemasukan = data
    .filter((item) => ["gaji", "dividen"].includes(item.kategori.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const dataPengeluaran = data
    .filter((item) => !["gaji", "dividen"].includes(item.kategori.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  // Komponen Reusable dengan list normal (Map) full-width
  const renderTable = (items: FormSummaryItem[], type: "pemasukan" | "pengeluaran") => {
    const isPemasukan = type === "pemasukan";
    const totalJumlah = items.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

    return (
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-zinc-800 shadow-xl w-full">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          {isPemasukan ? (
            <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownCircle className="w-4 h-4 text-red-500" />
          )}
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
            {isPemasukan ? "Tabel Klasifikasi Pemasukan" : "Tabel Klasifikasi Pengeluaran"}
          </h2>
        </div>

        <div className="w-full min-w-[800px] overflow-x-auto">
          {/* Header Tabel Grid */}
          <div className="flex bg-[#161616] border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-400 py-3">
            <div className="w-[18%] px-4">Timestamp</div>
            <div className="w-[12%] px-4">Tanggal</div>
            <div className="w-[18%] px-4">Jumlah</div>
            <div className="w-[17%] px-4">Kategori</div>
            <div className="w-[23%] px-4">Keterangan</div>
            <div className="w-[12%] px-4 text-center">Actions</div>
          </div>

          {/* Body Tabel Normal menggunakan map */}
          {items.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500 bg-[#1a1a1a]">
              Tidak ada transaksi {type}.
            </div>
          ) : (
            <div className="flex flex-col max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex border-b border-zinc-800/50 text-xs text-zinc-300 py-2.5 items-center hover:bg-zinc-800/30 transition-colors w-full"
                >
                  <div className="w-[18%] px-4 whitespace-nowrap text-zinc-400 truncate">
                    {formatTimestamp(item.timestamp)}
                  </div>
                  <div className="w-[12%] px-4 whitespace-nowrap truncate">{item.tanggal}</div>
                  <div className={`w-[18%] px-4 font-mono font-semibold truncate ${isPemasukan ? "text-emerald-400" : "text-zinc-200"}`}>
                    {formatRupiah(item.jumlah)}
                  </div>
                  <div className="w-[17%] px-4 text-zinc-400 truncate">{item.kategori}</div>
                  <div className="w-[23%] px-4 truncate text-zinc-300" title={item.keterangan}>
                    {item.keterangan || "-"}
                  </div>
                  <div className="w-[12%] px-4 whitespace-nowrap text-center space-x-1.5 flex justify-center items-center">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-1.5 py-0.5 rounded border border-zinc-700 transition-colors inline-flex items-center gap-0.5 text-[10px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-zinc-800 hover:bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded border border-zinc-700 hover:border-red-900/50 transition-colors inline-flex items-center gap-0.5 text-[10px]"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Anggaran */}
          {items.length > 0 && (
            <div className="flex bg-[#161616] border-t border-zinc-800 font-bold text-zinc-200 text-xs py-3 items-center">
              <div className="w-[30%] px-4 tracking-wide text-[11px]">
                TOTAL {type.toUpperCase()}
              </div>
              <div className={`w-[70%] px-4 font-mono text-sm ${isPemasukan ? "text-emerald-500" : "text-red-500"}`}>
                {formatRupiah(totalJumlah)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] p-4 font-sans w-full">
      <div className="w-full space-y-6">
        
        {/* Header & Button Actions */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-lg font-bold tracking-wide uppercase text-gray-200">
              FORM SUMMARY TRANSAKSI KELUARGA
            </h1>
            <p className="text-zinc-500 text-[11px] mt-0.5">Klasifikasi otomatis arus masuk dan keluar tabungan.</p>
          </div>
          <button
            onClick={handleAddNewClick}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-3 py-1.5 rounded-md transition-colors duration-200 text-xs border border-zinc-700 flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" /> Add New Record
          </button>
        </div>

        {loading ? (
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-xl p-10 text-center text-xs text-zinc-500 animate-pulse w-full">
            Memuat sinkronisasi database summary...
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {/* Tabel Pengeluaran berada di Atas */}
            {renderTable(dataPengeluaran, "pengeluaran")}

            {/* Tabel Pemasukan berada di Bawah */}
            {renderTable(dataPemasukan, "pemasukan")}
          </div>
        )}
      </div>

      {/* Pop-up Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-sm rounded-xl p-5 shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-3 border-b border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-gray-200">
                {editingId ? "Edit Transaksi" : "Tambah Data Baru"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg font-semibold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Input Tanggal */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-[#242424] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 scheme-dark"
                />
              </div>

              {/* Input Kategori Dropdown Referensi Dinamis */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Kategori (Ref: Master Plan Anggaran Bulan Ini)
                </label>
                <select
                  value={kategori}
                  required
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-[#242424] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {masterCategories.length === 0 ? (
                    <option value="" disabled>
                      -- Tidak ada anggaran plan di bulan ini --
                    </option>
                  ) : (
                    masterCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#242424]">
                        {cat}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Input Jumlah */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Jumlah (Rp.)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 50000"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full bg-[#242424] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Input Keterangan */}
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                  Keterangan
                </label>
                <textarea
                  placeholder="Susu dan roti, dll..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={2}
                  className="w-full bg-[#242424] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-zinc-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={masterCategories.length === 0}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingId ? "Simpan Perubahan" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}