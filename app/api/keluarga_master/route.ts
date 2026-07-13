import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

// -------------------------------------------------------------------
// GET: Mengambil semua data atau data spesifik berdasarkan ID
// -------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // SOLUSI: Pisahkan eksekusi agar TypeScript tidak bingung mendeteksi tipe data builder
    if (id) {
      const { data, error } = await supabase
        .from("keluarga_master_plan")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data }, { status: 200 });
    } else {
      const { data, error } = await supabase
        .from("keluarga_master_plan")
        .select("*")
        .order("date_plan", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, data }, { status: 200 });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// -------------------------------------------------------------------
// POST: Membuat data plan baru
// -------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { date_plan, category, target, actual } = body;

    // Validasi input sederhana
    if (!date_plan || !category) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Kolom 'sisa' tidak perlu di-insert karena dihitung otomatis oleh DB
    const { data, error } = await supabase
      .from("keluarga_master_plan")
      .insert([{ date_plan, category, target, actual }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// -------------------------------------------------------------------
// PUT: Memperbarui data plan berdasarkan ID
// -------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { id, date_plan, category, target, actual } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required for update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("keluarga_master_plan")
      .update({ date_plan, category, target, actual })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// -------------------------------------------------------------------
// DELETE: Menghapus data plan berdasarkan ID
// -------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required for deletion" }, { status: 400 });
    }

    const { error } = await supabase
      .from("keluarga_master_plan")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Row with ID ${id} deleted successfully` }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}