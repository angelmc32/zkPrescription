import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { SignerOrProvider } from "@ethereum-attestation-service/eas-sdk/dist/transaction";
import { ethers } from "ethers";

type PrescriptionType = {
  medicIdentity?: string;
  patientIdentity?: string;
  medicationName: string;
  medicationDoseForm: string;
  medicationDosage: string;
  treatmentInstructions: string;
  treatmentDuration: number;
  zkPrescriptionGroupId: string;
  zkPrescriptionProof: string;
};

export async function createOnchainAttestation(prescriptionForm: PrescriptionType) {
  const eas = new EAS("0xaEF4103A04090071165F78D45D83A0C0782c2B2a");
  const provider = new ethers.JsonRpcProvider("https://sepolia-rpc.scroll.io/");
  const signer = await provider.getSigner();
  eas.connect(signer as unknown as SignerOrProvider);

  // Initialize SchemaEncoder with the schema string
  const schemaEncoder = new SchemaEncoder(
    "uint256 medicIdentity, uint256 patientIdentity, string medicationName, string medicationDoseForm, string medicationDosage, string treatmentInstructions, uint256 treatmentDuration, uint256 prescriptionGroupId, uint256 prescriptionProof",
  );
  const encodedData = schemaEncoder.encodeData([
    { name: "medicIdentity", value: 1, type: "uint256" },
    { name: "patientIdentity", value: 1, type: "uint256" },
    { name: "medicationName", value: "Salbutamol", type: "string" },
    { name: "medicationDoseForm", value: "Aerosol", type: "string" },
    { name: "medicationDosage", value: "20 mcg", type: "string" },
    { name: "treatmentInstructions", value: "2 disparos cada 8 horas, usar respirador", type: "string" },
    { name: "treatmentDuration", value: 60, type: "uint256" },
    { name: "prescriptionGroupId", value: 1, type: "uint256" },
    { name: "prescriptionProof", value: 1, type: "uint256" },
  ]);

  const schemaUID = "0x28597fbcd7ac1ae89090c0b0138441b64e790ff76f4d8ad579f9fe8f5767a987";

  const tx = await eas.attest({
    schema: schemaUID,
    data: {
      recipient: "0xF54f4815f62ccC360963329789d62d3497A121Ae", // Prezkription deployer address
      expirationTime: 0n,
      revocable: true, // Be aware that if your schema is not revocable, this MUST be false
      data: encodedData,
    },
  });

  const newAttestationUID = await tx.wait();

  console.log("New attestation UID:", newAttestationUID);
}
