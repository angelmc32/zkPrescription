import { NextResponse } from "next/server";
import { addMemberByApiKey, getGroup } from "~~/services/bandada";
import { getRoot } from "~~/services/semaphore";
import supabase from "~~/services/supabase/supabaseClient";

export async function POST(request: Request) {
  if (typeof process.env.NEXT_PUBLIC_PREZKRIPTIONS_GROUP_API_KEY !== "string") {
    throw new Error(
      "Please, define NEXT_PUBLIC_PREZKRIPTIONS_GROUP_API_KEY in your .env.development.local or .env.production.local file",
    );
  }
  const apiKey = process.env.NEXT_PUBLIC_PREZKRIPTIONS_GROUP_API_KEY ?? "";
  const { commitment, groupId } = await request.json();

  try {
    await addMemberByApiKey(groupId, commitment, apiKey);
    const group = await getGroup(groupId);
    if (group) {
      const groupRoot = await getRoot(groupId, group.treeDepth, group.members);
      const { error } = await supabase.from("root_history_prescriptions").insert([{ root: groupRoot.toString() }]);

      if (error) {
        console.error(error);
        return NextResponse.json({ error: error }, { status: 500, statusText: "an error occurred in the server :(" });
      }

      return NextResponse.json(
        { message: "you should have been added to the group :P", success: true },
        { status: 200, statusText: "everything seems to have gone well..." },
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500, statusText: "an error occurred in the server :(" });
  }
}
