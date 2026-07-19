"use client";

import { useState, useEffect } from "react";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter
} from "lucide-react";

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

  const [masterCategories, setMasterCategories] = useState<string[]>([]);

  // 1 & 2. State Filter Date Global (Default: Bulan & Tahun Hari Ini)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().substring(0, 7); // Hasil: "YYYY-MM"
  });

  // State Filter Kategori Dropdown untuk masing-masing jurnal
  const [selectedCategoryPengeluaran, setSelectedCategoryPengeluaran] = useState<string>("");
  const [selectedCategoryPemasukan, setSelectedCategoryPemasukan] = useState<string>("");

  // State General Search untuk masing-masing jurnal
  const [searchPengeluaran, setSearchPengeluaran] = useState<string>("");
  const [searchPemasukan, setSearchPemasukan] = useState<string>("");

  // State Manajemen Sorting (Berdasarkan Tanggal / Jumlah nilai mutasi)
  const [sortPengeluaran, setSortPengeluaran] = useState<{ key: "tanggal" | "jumlah" | null; direction: "asc" | "desc" }>({ key: null, direction: "desc" });
  const [sortPemasukan, setSortPemasukan] = useState<{ key: "tanggal" | "jumlah" | null; direction: "asc" | "desc" }>({ key: null, direction: "desc" });

  // State Manajemen Pagination (Limit 20 baris per halaman)
  const ITEMS_PER_PAGE = 20;
  const [currentPagePengeluaran, setCurrentPagePengeluaran] = useState<number>(1);
  const [currentPagePemasukan, setCurrentPagePemasukan] = useState<number>(1);

  // State untuk Form Modal Internal
  const [tanggal, setTanggal] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [jumlah, setJumlah] = useState<number | string>("");
  const [kategori, setKategori] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");

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

  const fetchMasterCategories = async (currentDate: string) => {
    if (!currentDate) return;
    const targetMonth = currentDate.substring(0, 7);
    try {
      const response = await fetch("/api/keluarga_master");
      const result = await response.json();
      if (result.success) {
        const listMaster: MasterPlanItem[] = result.data;
        const filteredCategories = listMaster
          .filter((item) => item.date_plan.startsWith(targetMonth))
          .map((item) => item.category);

        const uniqueCategories = Array.from(new Set(filteredCategories));
        setMasterCategories(uniqueCategories);

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

  useEffect(() => {
    fetchMasterCategories(tanggal);
  }, [tanggal]);

  // Reset filter kategori jika bulan global berubah
  useEffect(() => {
    setSelectedCategoryPemasukan("");
    setSelectedCategoryPengeluaran("");
  }, [selectedMonth]);

  const handleAddNewClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditingId(null);
    setTanggal(today);
    setJumlah("");
    setKeterangan("");
    setIsModalOpen(true);
  };

  const handleEditClick = (item: FormSummaryItem) => {
    if (!item.id) return;
    setEditingId(item.id);
    setTanggal(item.tanggal);
    setJumlah(item.jumlah);
    setKategori(item.kategori);
    setKeterangan(item.keterangan || "");
    setIsModalOpen(true);
  };

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

  const handleSort = (type: "pemasukan" | "pengeluaran", key: "tanggal" | "jumlah") => {
    const isPemasukan = type === "pemasukan";
    const currentSort = isPemasukan ? sortPemasukan : sortPengeluaran;
    const setSort = isPemasukan ? setSortPemasukan : setSortPengeluaran;

    if (currentSort.key === key) {
      setSort({ key, direction: currentSort.direction === "asc" ? "desc" : "asc" });
    } else {
      setSort({ key, direction: "desc" });
    }
  };

  const applySorting = (items: FormSummaryItem[], config: { key: "tanggal" | "jumlah" | null; direction: "asc" | "desc" }) => {
    if (!config.key) return items;

    return [...items].sort((a, b) => {
      if (config.key === "tanggal") {
        const dateA = new Date(a.tanggal).getTime();
        const dateB = new Date(b.tanggal).getTime();
        return config.direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (config.key === "jumlah") {
        return config.direction === "asc" ? a.jumlah - b.jumlah : b.jumlah - a.jumlah;
      }
      return 0;
    });
  };

  // 3. Filter data berdasarkan Bulan yang dipilih (Selected Date Filter)
  const filteredDataByMonth = data.filter((item) => item.tanggal.startsWith(selectedMonth));

  // Pemisahan awal & sorting default berbasis timestamp
  const rawPemasukan = filteredDataByMonth
    .filter((item) => ["gaji", "dividen"].includes(item.kategori.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const rawPengeluaran = filteredDataByMonth
    .filter((item) => !["gaji", "dividen"].includes(item.kategori.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  // Mendapatkan daftar kategori unik untuk opsi filter dropdown berdasarkan data bulan ini
  const uniqueCategoriesPemasukan = Array.from(new Set(rawPemasukan.map(item => item.kategori)));
  const uniqueCategoriesPengeluaran = Array.from(new Set(rawPengeluaran.map(item => item.kategori)));

  // Filter tambahan untuk General Search (Kategori & Keterangan)
  const searchFilteredPemasukan = rawPemasukan.filter((item) => {
    const searchLower = searchPemasukan.toLowerCase();
    return (
      item.kategori.toLowerCase().includes(searchLower) ||
      item.keterangan.toLowerCase().includes(searchLower)
    );
  });

  const searchFilteredPengeluaran = rawPengeluaran.filter((item) => {
    const searchLower = searchPengeluaran.toLowerCase();
    return (
      item.kategori.toLowerCase().includes(searchLower) ||
      item.keterangan.toLowerCase().includes(searchLower)
    );
  });

  // Filter tambahan berdasarkan Dropdown Kategori Terpilih
  const categoryFilteredPemasukan = searchFilteredPemasukan.filter((item) => {
    if (!selectedCategoryPemasukan) return true;
    return item.kategori === selectedCategoryPemasukan;
  });

  const categoryFilteredPengeluaran = searchFilteredPengeluaran.filter((item) => {
    if (!selectedCategoryPengeluaran) return true;
    return item.kategori === selectedCategoryPengeluaran;
  });

  // Integrasi Eksekusi Kriteria Pengurutan Kolom Aktif
  const dataPemasukan = applySorting(categoryFilteredPemasukan, sortPemasukan);
  const dataPengeluaran = applySorting(categoryFilteredPengeluaran, sortPengeluaran);

  const renderTable = (items: FormSummaryItem[], type: "pemasukan" | "pengeluaran") => {
    const isPemasukan = type === "pemasukan";
    
    const totalJumlah = items.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
    
    const currentPage = isPemasukan ? currentPagePemasukan : currentPagePengeluaran;
    const setCurrentPage = isPemasukan ? setCurrentPagePemasukan : setCurrentPagePengeluaran;
    const searchValue = isPemasukan ? searchPemasukan : searchPengeluaran;
    const setSearchValue = isPemasukan ? setSearchPemasukan : setSearchPengeluaran;
    
    const selectedCategory = isPemasukan ? selectedCategoryPemasukan : selectedCategoryPengeluaran;
    const setSelectedCategory = isPemasukan ? setSelectedCategoryPemasukan : setSelectedCategoryPengeluaran;
    const listUniqueCategories = isPemasukan ? uniqueCategoriesPemasukan : uniqueCategoriesPengeluaran;

    const currentSort = isPemasukan ? sortPemasukan : sortPengeluaran;
    
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const displayedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-zinc-800 shadow-xl w-full">
        <div className="p-4 border-b border-zinc-800 bg-[#1f1f1f] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              {isPemasukan ? (
                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-rose-500" />
              )}
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 whitespace-nowrap">
                {isPemasukan ? "Buku Jurnal Pemasukan" : "Buku Jurnal Pengeluaran"}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
              {/* Input General Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-zinc-500" />
                </span>
                <input
                  type="text"
                  placeholder="Cari kategori / keterangan..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#151515] text-zinc-200 placeholder-zinc-600 text-xs rounded border border-zinc-800 pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                />
              </div>

              {/* Filter Dropdown Kategori */}
              <div className="relative min-w-[150px]">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <Filter className="h-3.5 w-3.5 text-zinc-500" />
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1); // reset ke halaman 1 saat filter diubah
                  }}
                  className="w-full bg-[#151515] text-zinc-200 text-xs rounded border border-zinc-800 pl-8 pr-6 py-1.5 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Semua Kategori</option>
                  {listUniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-zinc-500">
                  ▼
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              Records: {items.length} entri
            </span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 block md:hidden">
              ← Geser untuk detail →
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs text-zinc-300">
            <thead>
              <tr className="bg-[#151515] border-b border-zinc-800 text-[11px] font-medium uppercase tracking-wider text-zinc-400 select-none">
                <th 
                  onClick={() => handleSort(type, "tanggal")}
                  className="py-3 px-4 font-medium border-r border-zinc-800/30 w-[15%] text-center cursor-pointer hover:bg-zinc-800/60 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Tanggal Dok.
                    {currentSort.key === "tanggal" ? (
                      currentSort.direction === "asc" ? <ArrowUp className="w-3 h-3 text-sky-400" /> : <ArrowDown className="w-3 h-3 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 font-medium border-r border-zinc-800/30 w-[20%] text-right">Kategori</th>
                <th className="py-3 px-4 font-medium border-r border-zinc-800/30 w-[35%]">Keterangan / Memo</th>
                <th 
                  onClick={() => handleSort(type, "jumlah")}
                  className="py-3 px-4 font-medium border-r border-zinc-800/30 w-[18%] text-right cursor-pointer hover:bg-zinc-800/60 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    Nilai Nominal (IDR)
                    {currentSort.key === "jumlah" ? (
                      currentSort.direction === "asc" ? <ArrowUp className="w-3 h-3 text-sky-400" /> : <ArrowDown className="w-3 h-3 text-sky-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 font-medium w-[12%] text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-500 bg-[#1a1a1a]">
                    Tidak ditemukan catatan transaksi posting yang cocok pada pos {type}.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors duration-150"
                  >
                    <td className="py-2.5 px-4 font-mono text-center border-r border-zinc-800/30 whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 font-medium border-r border-zinc-800/30 truncate max-w-[150px] text-right">
                      {item.kategori.toUpperCase()}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-300 border-r border-zinc-800/30 truncate max-w-[220px]" title={item.keterangan}>
                      {item.keterangan || "-"}
                    </td>
                    <td className={`py-2.5 px-4 font-mono font-medium text-right border-r border-zinc-800/30 whitespace-nowrap ${isPemasukan ? "text-emerald-400" : "text-zinc-200"}`}>
                      {formatRupiah(item.jumlah)}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-sky-400 px-2 py-0.5 rounded border border-zinc-700 transition-colors text-[11px]"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-zinc-800 hover:bg-rose-950/30 text-rose-400 px-2 py-0.5 rounded border border-zinc-700 hover:border-rose-900/40 transition-colors text-[11px]"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {items.length > 0 && (
              <tfoot>
                <tr className="bg-[#151515] font-bold text-zinc-200 border-t border-zinc-800">
                  <td colSpan={3} className="py-3 px-4 text-left tracking-wide text-[11px] uppercase border-r border-zinc-800/30">
                    Total Saldo Buku Pos {type} (Bulan Terpilih &amp; Filter)
                  </td>
                  <td className={`py-3 px-4 font-mono text-sm text-right border-r border-zinc-800/30 ${isPemasukan ? "text-emerald-500" : "text-rose-500"}`}>
                    {formatRupiah(totalJumlah)}
                  </td>
                  <td className="bg-[#151515]"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {items.length > ITEMS_PER_PAGE && (
          <div className="p-3 bg-[#151515] border-t border-zinc-800 flex items-center justify-between gap-4">
            <span className="text-[11px] text-zinc-500 font-mono">
              Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, items.length)} dari {items.length} entri
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1 text-zinc-400 bg-zinc-800 rounded border border-zinc-700 hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-2.5 py-0.5 text-[11px] font-mono font-medium rounded border transition-all ${
                    currentPage === pageNumber
                      ? "bg-zinc-200 text-zinc-900 border-zinc-200"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1 text-zinc-400 bg-zinc-800 rounded border border-zinc-700 hover:bg-zinc-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#e2e2e2] p-4 font-sans w-full antialiased">
      <div className="w-full space-y-6 max-w-7xl mx-auto">
        
        {/* Header & Button Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-4 gap-4">
          <div>
            <h1 className="text-base font-semibold tracking-wider uppercase text-zinc-100">
              SISTEM SUMMARY AKUNTANSI TRANSAKSI KELUARGA
            </h1>
            <p className="text-zinc-500 text-[11px] mt-0.5">Penjurnalan otomatis klasifikasi debet dan kredit keuangan mandiri.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-zinc-700 rounded px-2.5 py-1.5 min-w-[180px]">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPagePemasukan(1);
                  setCurrentPagePengeluaran(1);
                }}
                className="bg-transparent text-xs text-white focus:outline-none scheme-dark font-mono cursor-pointer w-full"
              />
            </div>

            <button
              onClick={handleAddNewClick}
              className="bg-zinc-200 hover:bg-white text-zinc-900 font-medium px-3 py-1.5 rounded flex items-center gap-1.5 shadow-md text-xs transition-all duration-150"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600 font-bold" /> Jurnal Transaksi Baru
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#1a1a1a] border border-zinc-800 rounded-lg p-12 text-center text-xs text-zinc-500 animate-pulse w-full">
            Sinkronisasi ledger neraca database...
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {renderTable(dataPengeluaran, "pengeluaran")}
            {renderTable(dataPemasukan, "pemasukan")}
          </div>
        )}
      </div>

      {/* Pop-up Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-4">
          <div className="bg-[#1a1a1a] border border-zinc-800 w-full max-w-sm rounded-lg p-5 shadow-2xl text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                {editingId ? "Koreksi Pos Jurnal (Edit)" : "Entri Jurnal Pos Baru"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg font-normal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-500" /> Tanggal Valuta (Value Date)
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-[#222222] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 scheme-dark font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">
                  Alokasi Akun Rekening (Ref: Master Plan)
                </label>
                <select
                  value={kategori}
                  required
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-[#222222] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {masterCategories.length === 0 ? (
                    <option value="" disabled>
                      -- Tidak ada pos rekening aktif bulan ini --
                    </option>
                  ) : (
                    masterCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#222222]">
                        {cat.toUpperCase()}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">
                  Jumlah Nominal Mutasi (IDR)
                </label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full bg-[#222222] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase mb-1">
                  Keterangan Deskripsi / Memo Jurnal
                </label>
                <textarea
                  placeholder="Tulis deskripsi pelaporan..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={2}
                  className="w-full bg-[#222222] border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={masterCategories.length === 0}
                  className="px-3 py-1.5 text-[11px] font-medium bg-zinc-200 hover:bg-white text-zinc-900 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {editingId ? "Posting Koreksi" : "Posting Jurnal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}