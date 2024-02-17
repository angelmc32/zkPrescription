import { NextResponse } from "next/server";
import supabase from "~~/services/supabase/supabaseClient";

type CustomErrorType = {
  cause?: string;
  message?: string;
};

export async function POST(request: Request) {
  console.log("entering POST");
  const { address, commitment, username } = await request.json();

  console.log("before TRY");
  try {
    console.log("entering TRY");
    if (!address || !commitment || !username) {
      console.log("missing data :(");
      throw new Error("address, commitment or username missing :(");
    }

    console.log("inserting in database");

    const { data: duplicateIdentity } = await supabase.from("identity").select().eq("commitment", commitment);

    if (duplicateIdentity && duplicateIdentity[0]) {
      console.log(duplicateIdentity);
      return NextResponse.json(
        { error: "duplicate identity", success: false },
        { status: 500, statusText: "duplicate identity" },
      );
    }

    const { data, error } = await supabase.from("identity").insert({ address, commitment, username }).select();

    if (!data || error) {
      console.error(error);
      return NextResponse.json(
        { error: error, success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    return NextResponse.json({ identity: data[0], success: true });
  } catch (error: unknown) {
    console.error((error as CustomErrorType).cause);
    return NextResponse.json(
      { error: (error as CustomErrorType).message, success: false },
      { status: 500, statusText: "error in the server, check the console" },
    );
  }
}
