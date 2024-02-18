import { NextResponse } from "next/server";
import supabase from "~~/services/supabase/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("prescription").select().order("created_at", { ascending: false });

  if (data) {
    return NextResponse.json({ prescriptions: data, success: true });
  } else if (error) {
    console.log("este es el pedo weee");
    console.log(error);
    return NextResponse.json(
      { error: "something went wrong", success: false },
      { status: 500, statusText: "error in the server, check the console" },
    );
  } else {
    return NextResponse.json(
      { error: "something went terrible", success: false },
      { status: 500, statusText: "error in the server, check the console" },
    );
  }
}
