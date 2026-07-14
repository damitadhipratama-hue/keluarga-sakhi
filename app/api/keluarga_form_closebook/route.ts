import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

// ==========================================
// 1. GET - Mengambil Semua Data / Ledger
// ==========================================
export async function GET() {
  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("form_closebook")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data" },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST - Entri Jurnal Pos Baru
// ==========================================
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { tanggal, jumlah, kategori, keterangan } = body;

    if (!tanggal || !jumlah || !kategori) {
      return NextResponse.json(
        { success: false, error: "Kolom tanggal, jumlah, dan kategori wajib diisi." },
        { status: 400 }
      );
    }

  const { data, error } = await supabase
      .from("form_closebook")
      .insert([
        {
          tanggal,
          jumlah: Number(jumlah),
          kategori,
          keterangan: keterangan || null,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data baru" },
      { status: 500 }
    );
  }
}

// ==========================================
// 3. PUT - Koreksi Pos Jurnal (Edit)
// ==========================================
export async function PUT(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { id, tanggal, jumlah, kategori, keterangan } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID data diperlukan untuk melakukan pembaruan." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("form_closebook")
      .update({
        tanggal,
        jumlah: Number(jumlah),
        kategori,
        keterangan: keterangan || null,
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui data" },
      { status: 500 }
    );
  }
}

// ==========================================
// 4. DELETE - Menghapus Data Jurnal
// ==========================================
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID data diperlukan untuk menghapus." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("form_closebook")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus data" },
      { status: 500 }
    );
  }
}