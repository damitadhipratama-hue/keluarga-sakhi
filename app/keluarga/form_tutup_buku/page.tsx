"use client";

import { useState, useEffect } from "react";
import { ArrowDownCircle, Calendar, Plus, ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface FormSummaryItem {
  id?: number;
  timestamp?: string;
  tanggal: string;
  jumlah: number;
  kategori: string;
  keterangan: string;
}

interface MasterItem {
  id?: number;
  date_plan: string; 
  category: string;
  target: number;
  actual?: number;
}

const MASTER_CATEGORIES = [
  "BCA Suami",
  "CIMB Niaga",
  "Cash Gabungan",
  "BCA Mandiri Istri",
  "Menghutangi",
  "Teriot",
  "Saham Bibit",
  "Gaji",     
  "Dividen"   
];

export default function KeluargaFormPage() {
  const [data, setData] = useState<FormSummaryItem[]>([]); 
  const [masterData, setMasterData] = useState<MasterItem[]>([]); 
  const [formData, setFormData] = useState<FormSummaryItem[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().substring(0, 7);
  });

  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [tanggal, setTanggal] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [jumlah, setJumlah] = useState<number | string>("");
  const [kategori, setKategori] = useState<string>(MASTER_CATEGORIES[0]);
  const [keterangan, setKeterangan] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resClosebook, resMaster, resForm] = await Promise.all([
        fetch("/api/keluarga_form_closebook").catch(() => null),
        fetch("/api/keluarga_master_plan").catch(() => null), 
        fetch("/api/keluarga_form").catch(() => null) 
      ]);

      if (resClosebook && resClosebook.ok) {
        const resultClosebook = await resClosebook.json();
        if (resultClosebook.success) {
          setData(resultClosebook.data);
        }
      }

      if (resMaster && resMaster.ok) {
        const resultMaster = await resMaster.json();
        if (resultMaster.success) {
          setMasterData(resultMaster.data);
        }
      }

      if (resForm && resForm.ok) {
        const resultForm = await resForm.json();
        if (resultForm.success) {
          setFormData(resultForm.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNewClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditingId(null);
    setTanggal(today);
    setJumlah("");
    setKategori(MASTER_CATEGORIES[0]);
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
      const response = await fetch(`/api/keluarga_form_closebook?id=${id}`, {
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
    if (!kategori) return alert("Kategori wajib dipilih!");

    const url = "/api/keluarga_form_closebook";
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

  const handleDownloadPDF = () => {
    window.print();
  };

  // Filter data Closebook berdasarkan bulan
  const filteredDataByMonth = data
    .filter((item) => item.tanggal.startsWith(selectedMonth))
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  // Filter data Transaksi Form berdasarkan bulan
  const filteredFormDataByMonth = formData
    .filter((item) => item.tanggal.startsWith(selectedMonth));

  // --- LOGIKA PERHITUNGAN TABEL UTAMA (CLOSEBOOK) ---
  const totalJumlah = filteredDataByMonth.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  
  const totalMenghutangi = filteredDataByMonth
    .filter(item => item.kategori.toLowerCase() === "menghutangi")
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const totalReal = totalJumlah - totalMenghutangi;

  const totalExcludedOnhand = filteredDataByMonth
    .filter(item => ["menghutangi", "saham bibit", "teriot"].includes(item.kategori.toLowerCase()))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const totalOnhand = totalJumlah - totalExcludedOnhand;

  const [year, month] = selectedMonth.split('-');
  const prevDate = new Date(parseInt(year), parseInt(month) - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  
  const prevMonthData = data.filter(item => item.tanggal.startsWith(prevMonthStr));
  const totalPrevMonth = prevMonthData.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  let persentase = 0;
  let persentaseText = "0.00%";
  if (totalPrevMonth !== 0) {
    persentase = ((totalJumlah - totalPrevMonth) / totalPrevMonth) * 100;
    persentaseText = `${persentase > 0 ? '+' : ''}${persentase.toFixed(2)}%`;
  } else if (totalJumlah > 0) {
    persentaseText = "+100.00%";
  }

  // --- LOGIKA KHUSUS REPORT POP-UP ---
  const formattedMonthName = new Date(selectedMonth + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Pemasukan: HANYA Gaji dan Dividen
  const totalPemasukan = filteredFormDataByMonth
    .filter(item => ["gaji", "dividen"].includes((item.kategori || "").toLowerCase()))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  // Pengeluaran: SEMUA KECUALI Gaji dan Dividen
  const totalPengeluaran = filteredFormDataByMonth
    .filter(item => !["gaji", "dividen"].includes((item.kategori || "").toLowerCase()))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  // Net Difference: Total Pemasukan - Total Pengeluaran
  const netDifference = totalPemasukan - totalPengeluaran;

  // Target Bulan Depan
  const nextDate = new Date(parseInt(year), parseInt(month), 1);
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  
  const targetNextMonth = masterData
    .filter(m => m.date_plan && m.date_plan.startsWith(nextMonthStr) && !["gaji", "dividen"].includes((m.category || "").toLowerCase()))
    .reduce((sum, m) => sum + Number(m.target || 0), 0);


  const renderSingleTable = (items: FormSummaryItem[]) => {
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const displayedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm w-full">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-800">
              Buku Summary Jurnal Closebook
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
              Records: {items.length} entri
            </span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 block md:hidden">
              ← Geser untuk detail →
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs text-gray-700">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4 font-medium border-r border-gray-200 w-[15%] text-center">Tanggal Dok.</th>
                <th className="py-3 px-4 font-medium border-r border-gray-200 w-[18%] text-right">Nilai Nominal (IDR)</th>
                <th className="py-3 px-4 font-medium border-r border-gray-200 w-[20%] text-left">Kategori</th>
                <th className="py-3 px-4 font-medium border-r border-gray-200 w-[35%]">Keterangan / Memo</th>
                <th className="py-3 px-4 font-medium w-[12%] text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-500 bg-white">
                    Belum terdapat catatan transaksi posting closebook di bulan ini.
                  </td>
                </tr>
              ) : (
                displayedItems.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="py-2.5 px-4 font-mono text-center border-r border-gray-100 whitespace-nowrap text-gray-600">
                      {item.tanggal}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-right border-r border-gray-100 whitespace-nowrap text-gray-900">
                      {formatRupiah(item.jumlah)}
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 font-medium border-r border-gray-100 truncate max-w-[150px] text-left">
                      {item.kategori.toUpperCase()}
                    </td>
                    <td className="py-2.5 px-4 text-gray-600 border-r border-gray-100 truncate max-w-[220px]" title={item.keterangan}>
                      {item.keterangan || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="bg-gray-100 hover:bg-gray-200 text-sky-600 px-2 py-0.5 rounded border border-gray-200 transition-colors text-[11px]"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-gray-100 hover:bg-rose-100 text-rose-600 px-2 py-0.5 rounded border border-gray-200 hover:border-rose-200 transition-colors text-[11px]"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* UI Pembeda untuk Footer */}
            {items.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300 shadow-[inset_0_4px_6px_-4px_rgba(0,0,0,0.05)]">
                <tr className="font-bold text-gray-800 border-b border-gray-200">
                  <td className="py-3 px-4 text-left tracking-wide text-[11px] uppercase border-r border-gray-200 text-gray-600">
                    Total Kumulatif
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-right border-r border-gray-200 text-gray-900">
                    {formatRupiah(totalJumlah)}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-[10px] text-gray-500 font-normal italic">
                    (Bulan Terpilih)
                  </td>
                </tr>
                <tr className="font-bold text-gray-800 border-b border-gray-200">
                  <td className="py-3 px-4 text-left tracking-wide text-[11px] uppercase border-r border-gray-200 text-gray-600">
                    Total Real
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-right border-r border-gray-200 text-emerald-600">
                    {formatRupiah(totalReal)}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-[10px] text-gray-500 font-normal italic">
                    (Kumulatif - Menghutangi)
                  </td>
                </tr>
                <tr className="font-bold text-gray-800 border-b border-gray-200">
                  <td className="py-3 px-4 text-left tracking-wide text-[11px] uppercase border-r border-gray-200 text-gray-600">
                    Total Onhand
                  </td>
                  <td className="py-3 px-4 font-mono text-sm text-right border-r border-gray-200 text-sky-600">
                    {formatRupiah(totalOnhand)}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-[10px] text-gray-500 font-normal italic">
                    (Kumulatif - Menghutangi, Saham Bibit, Teriot)
                  </td>
                </tr>
                <tr className="font-bold text-gray-800">
                  <td className="py-3 px-4 text-left tracking-wide text-[11px] uppercase border-r border-gray-200 text-gray-600">
                    Persentase
                  </td>
                  <td className={`py-3 px-4 font-mono text-sm text-right border-r border-gray-200 ${persentase >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {persentaseText}
                  </td>
                  <td colSpan={3} className="py-3 px-4 text-[10px] text-gray-500 font-normal italic">
                    (Pertumbuhan dari Bulan Sebelumnya)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {items.length > ITEMS_PER_PAGE && (
          <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between gap-4">
            <span className="text-[11px] text-gray-500 font-mono">
              Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, items.length)} dari {items.length} entri
            </span>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1 text-gray-500 bg-white rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1 text-gray-500 bg-white rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
    <>
      {/* CSS Khusus untuk Print PDF (1 Lembar Pop-Up Style - Light Theme) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-report-container, #printable-report-container * {
            visibility: visible;
          }
          #printable-report-container {
            position: fixed !important;
            left: 0;
            top: 0;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            background-color: #f9fafb !important;
            margin: 0;
            padding: 0;
            z-index: 9999;
          }
          #printable-report {
            width: 100% !important;
            max-width: 420px !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 24px !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            padding: 24px !important;
            color: #1f2937 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="min-h-screen bg-gray-50 text-gray-800 p-4 font-sans w-full antialiased">
        <div className="w-full space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 gap-4">
            <div>
              <h1 className="text-base font-semibold tracking-wider uppercase text-gray-900">
                SISTEM FORM CLOSEBOOK AKUNTANSI KELUARGA
              </h1>
              <p className="text-gray-500 text-[11px] mt-0.5">Pencatatan total penutupan saldo berkala akun instrumen finansial.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2.5 py-1.5 min-w-[180px] shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs text-gray-900 focus:outline-none scheme-light font-mono cursor-pointer w-full"
                />
              </div>

              <button
                onClick={handleAddNewClick}
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-3 py-1.5 rounded flex items-center gap-1.5 shadow-md text-xs transition-all duration-150"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 font-bold" /> Jurnal Transaksi Baru
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-xs text-gray-500 animate-pulse w-full shadow-sm">
              Sinkronisasi ledger neraca database...
            </div>
          ) : (
            <div className="space-y-6 w-full">
              {renderSingleTable(filteredDataByMonth)}
              
              {/* Tombol Generate Report */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md text-xs tracking-wider uppercase transition-all duration-200"
                >
                  <FileText className="w-4 h-4" /> Generate Report Bulan {formattedMonthName}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Form Input */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-[2px] p-4">
            <div className="bg-white border border-gray-200 w-full max-w-sm rounded-lg p-5 shadow-2xl text-xs">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                  {editingId ? "Koreksi Pos Jurnal (Edit)" : "Entri Jurnal Pos Baru"}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-lg font-normal"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-medium text-gray-600 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" /> Tanggal Valuta (Value Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-500 scheme-light font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-600 uppercase mb-1">
                    Alokasi Akun Rekening
                  </label>
                  <select
                    value={kategori}
                    required
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-500 cursor-pointer"
                  >
                    {MASTER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-600 uppercase mb-1">
                    Jumlah Nominal Mutasi (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-600 uppercase mb-1">
                    Keterangan Deskripsi / Memo Jurnal
                  </label>
                  <textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-gray-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                    }}
                    className="px-3 py-1.5 text-[11px] font-medium bg-white hover:bg-gray-50 rounded border border-gray-300 text-gray-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-[11px] font-medium bg-gray-900 hover:bg-gray-800 text-white rounded transition-colors"
                  >
                    {editingId ? "Posting Koreksi" : "Posting Jurnal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pop-up Modal Detailed Analytics */}
        {isReportModalOpen && (
          <div id="printable-report-container" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-[2px] p-4">
            <div id="printable-report" className="bg-white border border-gray-200 w-full max-w-md rounded-3xl p-6 shadow-2xl text-xs text-gray-600 relative overflow-hidden">
              
              {/* Header Modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-wide">{formattedMonthName}</h2>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-rose-600 mt-0.5">
                    Detailed Analytics
                  </p>
                </div>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="no-print text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors w-8 h-8 flex items-center justify-center"
                >
                  <span className="text-lg font-light leading-none">&times;</span>
                </button>
              </div>

              {/* Container Utama (Inner Card) */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-5">
                
                {/* Row Net Difference */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                      Net Difference (Selisih)
                    </p>
                    <p className={`text-xl font-bold mt-1 font-mono ${netDifference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(netDifference)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${persentase >= 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                    {persentaseText}
                  </span>
                </div>

                {/* Grid Pemasukan & Pengeluaran */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3">
                    <p className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                      Total Pemasukan
                    </p>
                    <p className="text-xs font-bold text-emerald-600 mt-1 font-mono">
                      {formatRupiah(totalPemasukan)}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-3">
                    <p className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                      Total Pengeluaran
                    </p>
                    <p className="text-xs font-bold text-rose-600 mt-1 font-mono">
                      {formatRupiah(totalPengeluaran)}
                    </p>
                  </div>
                </div>

                {/* Breakdown List Akun */}
                <div className="space-y-3 pt-2 text-[11px]">
                  <div className="flex justify-between items-center text-gray-500 italic">
                    <span>Total Kumulatif</span>
                    <span className="font-mono font-bold text-gray-900">{formatRupiah(totalJumlah)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 italic">
                    <span>Total Real</span>
                    <span className="font-mono font-bold text-gray-900">{formatRupiah(totalReal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 italic">
                    <span>Total Onhand</span>
                    <span className="font-mono font-bold text-gray-900">{formatRupiah(totalOnhand)}</span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Kekayaan Total (Sama dengan Kumulatif) */}
                <div className="flex justify-between items-center font-bold">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">
                    Kekayaan Total
                  </span>
                  <span className="text-sm text-emerald-600 font-mono">
                    {formatRupiah(totalJumlah)}
                  </span>
                </div>

                {/* Card Rencana Pengeluaran Bulan Depan */}
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-200 text-gray-900">
                  <p className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                    Rencana Pengeluaran Bulan Depan
                  </p>
                  <p className="text-sm font-bold mt-1 font-mono text-gray-900">
                    {formatRupiah(targetNextMonth)}
                  </p>
                </div>

                {/* Growth Label */}
                <div className="text-center pt-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${persentase >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Persentase: {persentaseText}
                  </span>
                </div>

              </div>

              {/* Action Buttons di bagian bawah modal */}
              <div className="no-print grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold tracking-wider uppercase py-3 rounded-xl shadow-md text-[11px] transition-all duration-150 text-center"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold tracking-wider uppercase py-3 rounded-xl transition-all duration-150 text-center"
                >
                  Close Analysis
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}