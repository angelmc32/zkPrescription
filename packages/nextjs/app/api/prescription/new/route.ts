import { NextResponse } from "next/server";
import { verifyProof } from "@semaphore-protocol/proof";
import { getGroup } from "~~/services/bandada";
import supabase from "~~/services/supabase/supabaseClient";

type CustomErrorType = {
  cause?: string;
  message?: string;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let errorLog = "";
  if (typeof process.env.NEXT_PUBLIC_BANDADA_GROUP_ID !== "string") {
    throw new Error(
      "Please, define NEXT_PUBLIC_BANDADA_GROUP_ID in your .env.development.local or .env.production.local file",
    );
  }
  const groupId = process.env.NEXT_PUBLIC_BANDADA_GROUP_ID ?? "";
  const { prescriptionId, merkleTreeRoot, nullifierHash, proof } = await request.json();

  try {
    console.log("entering TRY");
    const group = await getGroup(groupId);
    if (!group) {
      errorLog = "This group does not exist";
      console.error(errorLog);
      throw new Error(errorLog);
    }

    const merkleTreeDepth = group.treeDepth;

    console.log("querying root_history");
    const { data: currentMerkleRoot, error: errorRootHistory } = await supabase
      .from("root_history")
      .select()
      .order("created_at", { ascending: false })
      .limit(1);

    if (errorRootHistory) {
      console.log("errorRootHistory", errorRootHistory);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    if (!currentMerkleRoot || currentMerkleRoot.length === 0) {
      errorLog = "Wrong currentMerkleRoot";
      console.error("!currentMerkleRoot errooooorrr", errorLog);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    if (merkleTreeRoot !== currentMerkleRoot[0].root) {
      // compare merkle tree roots
      console.log("querying dataMerkleTreeRoot");
      const { data: dataMerkleTreeRoot, error: errorMerkleTreeRoot } = await supabase
        .from("root_history")
        .select()
        .eq("root", merkleTreeRoot);

      if (errorMerkleTreeRoot) {
        console.log("errorMerkleTreeRoot", errorMerkleTreeRoot);
        return NextResponse.json(
          { error: "something went wrong", success: false },
          { status: 500, statusText: "error in the server, check the console" },
        );
      }

      if (!dataMerkleTreeRoot) {
        errorLog = "Wrong dataMerkleTreeRoot";
        console.error("!dataMerkleTreeRoot erooorrr", errorLog);
        return NextResponse.json(
          { error: "something went wrong", success: false },
          { status: 500, statusText: "error in the server, check the console" },
        );
      }

      if (dataMerkleTreeRoot.length === 0) {
        errorLog = "Merkle Root is not part of the group";
        console.log(errorLog);
        return NextResponse.json(
          { error: "something went wrong", success: false },
          { status: 500, statusText: "error in the server, check the console" },
        );
      }

      console.log("dataMerkleTreeRoot", dataMerkleTreeRoot);

      const merkleTreeRootDuration = group.fingerprintDuration;

      if (dataMerkleTreeRoot && Date.now() > Date.parse(dataMerkleTreeRoot[0].created_at) + merkleTreeRootDuration) {
        errorLog = "Merkle Tree Root is expired";
        console.log(errorLog);
        return NextResponse.json(
          { error: "something went wrong", success: false },
          { status: 500, statusText: "error in the server, check the console" },
        );
      }
    }

    console.log("querying nullifier");
    const { data: nullifier, error: errorNullifierHash } = await supabase
      .from("nullifier_hash")
      .select("nullifier")
      .eq("nullifier", nullifierHash);

    console.log("nullifier", nullifier);
    console.log("errorNullifierHash", errorNullifierHash);
    if (errorNullifierHash) {
      console.log(errorNullifierHash);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    if (!nullifier) {
      errorLog = "Wrong nullifier";
      console.log(errorLog);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    if (nullifier.length > 0) {
      errorLog = "You are using the same nullifier twice";
      console.log(errorLog);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    console.log("verifying prooof lfggg");
    const isVerified = await verifyProof(
      {
        merkleTreeRoot,
        nullifierHash,
        externalNullifier: groupId,
        signal: prescriptionId,
        proof,
      },
      merkleTreeDepth,
    );

    console.log("past da verification mofooo");
    if (!isVerified) {
      const errorLog = "The proof was not verified successfully";
      console.error(errorLog);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    const { error: errorNullifier } = await supabase.from("nullifier_hash").insert([{ nullifier: nullifierHash }]);

    if (errorNullifier) {
      console.error(errorNullifier);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    console.log("inserting prescription!!!");
    const { data: dataPrescriptionId, error: errorPrescriptionId } = await supabase
      .from("prescription")
      .insert([{ signal: prescriptionId }])
      .select()
      .order("created_at", { ascending: false });

    if (errorPrescriptionId) {
      console.error(errorPrescriptionId);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }

    if (!dataPrescriptionId) {
      const errorLog = "Wrong dataPrescriptionId";
      console.error(errorLog);
      return NextResponse.json(
        { error: "something went wrong", success: false },
        { status: 500, statusText: "error in the server, check the console" },
      );
    }
    return NextResponse.json({ dataPrescriptionId: dataPrescriptionId[0], success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "something went wrong", message: (error as CustomErrorType).message, success: false },
      { status: 500, statusText: "error in the server, check the console" },
    );
  }
}
