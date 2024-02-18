"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Identity } from "@semaphore-protocol/identity";

const groupId = process.env.NEXT_PUBLIC_BANDADA_GROUP_ID ?? "";
const prezkriptionsGroupId = process.env.NEXT_PUBLIC_PREZKRIPTIONS_GROUP_ID ?? "";

export default function ProofsPage() {
  const router = useRouter();

  const [medicationName, setMedicationName] = useState("");
  const [medicationDoseForm, setMedicationDoseForm] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [treatmentDuration, setTreatmentDuration] = useState(3);
  const [treatmentInstructions, setTreatmentInstructions] = useState("");
  const [patientId, setPatientId] = useState("");

  const [_identity, setIdentity] = useState<Identity>();
  const [_loading, setLoading] = useState<boolean>(false);
  const [prescriptionId, setPrescriptionId] = useState("");

  const localStorageTag = process.env.NEXT_PUBLIC_LOCAL_STORAGE_TAG ?? "";

  useEffect(() => {
    const identityString = localStorage.getItem(localStorageTag);

    if (!identityString) {
      router.push("/");
      return;
    }

    const identity = new Identity(identityString);

    setIdentity(identity);
  }, [router, localStorageTag]);

  async function createPrescription(event: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    const patientIdentity = new Identity(patientId);
    try {
      const response = await fetch("api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          commitment: patientIdentity.commitment.toString(),
        }),
      });

      if (response.status === 200) {
        console.log("patient identity added successfully, now generate proof");

        const prezkriptionIdentity = new Identity(prescriptionId);

        const response2 = await fetch("api/group/prezkriptions/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: prezkriptionsGroupId,
            commitment: prezkriptionIdentity.commitment.toString(),
          }),
        });
        if (response2.status === 200) {
          const form = {
            medicIdentity: _identity?.commitment.toString(),
            patientIdentity: patientIdentity.commitment.toString(),
            medicationName,
            medicationDoseForm,
            medicationDosage,
            treatmentInstructions,
            treatmentDuration,
            zkPrescriptionGroupId: prezkriptionsGroupId,
            zkPrescriptionProof: prezkriptionIdentity.commitment.toString(),
          };

          console.log(form);
          console.log("success!!");
        }
      } else {
        console.log(await response.json());
      }
    } catch (error) {
      console.log(error);

      alert("Some error occurred, please try again!");
    } finally {
      setLoading(false);
    }
  }

  // const renderPrescriptionId = () => {
  //   return (
  //     <div className="lg:w-2/5 md:w-2/4 w-full">
  //       <div className="flex justify-between items-center mb-10">
  //         <div className="text-2xl font-semibold text-foreground">
  //           PrescriptionId signals ({_prescriptionId?.length})
  //         </div>
  //         <div>
  //           <button
  //             className="flex justify-center items-center w-auto space-x-1 verify-btn text-lg font-medium rounded-md bg-gradient-to-r text-foreground"
  //             onClick={getPrescriptionId}
  //           >
  //             <span>Refresh</span>
  //           </button>
  //         </div>
  //       </div>

  //       <div className="flex justify-center items-center my-3">
  //         <button
  //           className="flex justify-center items-center w-full space-x-3 disabled:cursor-not-allowed disabled:opacity-50 verify-btn text-lg font-medium rounded-md px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-slate-100"
  //           onClick={sendPrescriptionId}
  //           disabled={_loading || _renderInfoLoading}
  //         >
  //           {_loading && <div className="loader"></div>}
  //           <span>Send PrescriptionId</span>
  //         </button>
  //       </div>

  //       {_renderInfoLoading && (
  //         <div className="flex justify-center items-center mt-20 gap-2">
  //           <div className="loader-app"></div>
  //           <div>Fetching prescriptionId</div>
  //         </div>
  //       )}

  //       {_prescriptionId ? (
  //         <div className="grid-rows-1 place-content-center">
  //           <div className="space-y-3">
  //             {_prescriptionId?.map((prescriptionId, i) => (
  //               <Link href={`${prescriptionId}`} key={`${prescriptionId}+${i}`}>
  //                 <div className="flex justify-center space-x-4 items-center border-2 p-2 rounded-lg border-slate-300">
  //                   <span>Prescription URL</span> <ArrowTopRightOnSquareIcon className="h-5 w-5" />
  //                 </div>
  //               </Link>
  //             ))}
  //           </div>
  //         </div>
  //       ) : (
  //         <div className="flex justify-center items-center mt-20">
  //           <div className="loader-app"></div>
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  return (
    <div className="flex-grow bg-base-300 w-full px-8 py-12">
      <div className="flex items-center flex-col w-full">
        <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center w-1/2 rounded-3xl space-y-4">
          <div className="flex justify-center items-center w-4/5">
            <h1 className="text-3xl font-semibold text-foreground">New Prescription</h1>
          </div>
          <div className="flex justify-center items-center w-4/5">
            <div className="w-full">
              <hr className="h-0.5 border-t-0 bg-slate-300 w-full" />
            </div>
          </div>
          <div className="flex justify-center items-center w-4/5">
            <form className="space-y-1 w-full" onSubmit={createPrescription}>
              <div className="">
                <label className="label py-1" htmlFor="medicIdentity">
                  <span className="text-base label-text">Medic Identity</span>
                </label>
                <input
                  type="text"
                  id="medicIdentity"
                  name="medicIdentity"
                  defaultValue={_identity?.commitment.toString() ?? ""}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                  disabled
                />
              </div>
              <div className="">
                <label className="label py-1" htmlFor="patientId">
                  <span className="text-base label-text">Patient ID</span>
                </label>
                <input
                  type="text"
                  id="patientId"
                  name="patientId"
                  value={patientId}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                  onChange={event => setPatientId(event.target.value)}
                />
              </div>
              <div className="">
                <label className="label py-1" htmlFor="patientId">
                  <span className="text-base label-text">Prescription ID</span>
                </label>
                <input
                  type="text"
                  id="prescriptionId"
                  name="prescriptionId"
                  value={prescriptionId}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                  onChange={event => setPrescriptionId(event.target.value)}
                />
              </div>
              <div>
                <label className="label py-1" htmlFor="medicationName">
                  <span className="text-base label-text">Medication name</span>
                </label>
                <input
                  type="text"
                  id="medicationName"
                  name="medicationName"
                  value={medicationName}
                  onChange={event => setMedicationName(event.target.value)}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                />
              </div>
              <div>
                <label className="label py-1" htmlFor="medicationDoseForm">
                  <span className="text-base label-text">Medication dose form</span>
                </label>
                <input
                  type="text"
                  id="medicationDoseForm"
                  name="medicationDoseForm"
                  value={medicationDoseForm}
                  onChange={event => setMedicationDoseForm(event.target.value)}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                />
              </div>
              <div>
                <label className="label py-1" htmlFor="medicationDoseForm">
                  <span className="text-base label-text">Medication dosage</span>
                </label>
                <input
                  type="text"
                  id="medicationDosage"
                  name="medicationDosage"
                  value={medicationDosage}
                  onChange={event => setMedicationDosage(event.target.value)}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                />
              </div>
              <div>
                <label className="label py-1" htmlFor="treatmentInstructions">
                  <span className="text-base label-text">Treatment instructions</span>
                </label>
                <textarea
                  id="treatmentInstructions"
                  name="treatmentInstructions"
                  value={treatmentInstructions}
                  onChange={event => setTreatmentInstructions(event.target.value)}
                  className="textarea textarea-bordered border-2 w-full rounded-lg bg-base-200 text-left"
                  rows={3}
                />
              </div>
              <div>
                <label className="label py-1" htmlFor="medicationDoseForm">
                  <span className="text-base label-text">Treatment duration</span>
                </label>
                <input
                  type="number"
                  id="treatmentDuration"
                  name="treatmentDuration"
                  defaultValue={treatmentDuration}
                  onChange={event => setTreatmentDuration(parseInt(event.target.value))}
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-left"
                />
              </div>
              <div className="w-full pt-8 pb-4 flex flex-col items-center space-y-4">
                <button className="btn btn-primary rounded-lg px-8 text-lg" disabled={_loading}>
                  {_loading ? "Signing..." : "Sign Prescription"} ✍️
                </button>
                <div className="w-3/4">This will generate a zero-knowledge proof to certify the prescription</div>
              </div>
            </form>
          </div>
          {/* <div className="flex justify-center items-center w-4/5">
            <div className="w-full">
              <Stepper step={3} onPrevClick={() => router.push("/groups")} />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
