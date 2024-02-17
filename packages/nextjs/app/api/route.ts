import { NextResponse } from "next/server";
import supabase from "~~/services/supabase/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("prescription").select().order("created_at", { ascending: false });

  if (data) {
    return NextResponse.json({ prescriptions: data });
  }

  if (error) {
    console.log(error);
    NextResponse.json({ error: error });
  }
}
