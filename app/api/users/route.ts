import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

const sanitizeUserPayload = (body: Record<string, unknown>) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  const password = typeof body.password === "string" ? body.password : "";
  // Tambahan untuk authority
  const authority = typeof body.authority === "string" ? body.authority : "User";

  return {
    name,
    email,
    phone,
    password,
    authority,
  };
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let query = supabase.from("users").select("*").order("created_at", { ascending: false });

    if (id) {
      query = query.eq("id", id).limit(1);
    }

    const { data, error } = await query; 

    if (error) throw error;

    return NextResponse.json(id ? data?.[0] ?? null : data);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const payload = sanitizeUserPayload(body);

    if (!payload.name || !payload.email || !payload.password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const { data, error } = await supabase.from("users").insert([payload]).select();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const sanitized = sanitizeUserPayload(rest);
    const { password, ...otherData } = sanitized;

    type UpdateDataType = typeof otherData & { 
      updated_at: string; 
      password?: string; 
    };

    const updateData: UpdateDataType = {
      ...otherData,
      updated_at: new Date().toISOString(),
    };

    if (password) {
      updateData.password = password;
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete user" }, { status: 500 });
  }
}