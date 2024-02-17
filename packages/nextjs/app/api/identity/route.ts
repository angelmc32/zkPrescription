import { NextResponse } from "next/server";
import supabase from "~~/services/supabase/supabaseClient";

type CustomErrorType = {
  cause?: string;
  message?: string;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  console.log("entering POST");
  const { commitment } = await request.json();

  try {
    console.log("entering TRY");
    if (!commitment) {
      console.log("missing commitment data :(");
      throw new Error("commitment missing :(");
    }

    console.log("querying database");

    const { data: identityArray } = await supabase.from("identity").select().eq("commitment", commitment);

    if (identityArray) {
      return NextResponse.json({ identity: identityArray[0], message: "duplicate identity", success: true });
    } else {
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }
  } catch (error: unknown) {
    console.error((error as CustomErrorType).cause);
    return NextResponse.json({ message: (error as CustomErrorType).message, success: false });
  }
}
