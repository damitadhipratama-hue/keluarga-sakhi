import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/app/lib/supabase";

// ==========================================
// 1. GET: Mengambil Semua Data
// ==========================================
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('form_summary')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('id', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. POST: Membuat Data Baru
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { tanggal, jumlah, kategori, keterangan } = body;

    // Validasi input dasar
    if (!tanggal || jumlah === undefined || !kategori) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: tanggal, jumlah, or kategori' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('form_summary')
      .insert([
        { 
          tanggal, 
          jumlah, 
          kategori, 
          keterangan: keterangan || null 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ==========================================
// 3. PUT: Memperbarui Data Berdasarkan ID
// ==========================================
export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    const { id, tanggal, jumlah, kategori, keterangan } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for updating data' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('form_summary')
      .update({ 
        tanggal, 
        jumlah, 
        kategori, 
        keterangan: keterangan || null 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ==========================================
// 4. DELETE: Menghapus Data (?id=X)
// ==========================================
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('form_summary')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: `Data with ID ${id} deleted successfully`, data },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}