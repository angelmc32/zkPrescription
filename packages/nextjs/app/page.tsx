"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Identity } from "@semaphore-protocol/identity";
import type { NextPage } from "next";
import { recoverMessageAddress } from "viem";
import { useSignMessage } from "wagmi";
import Stepper from "~~/components/stepper";

const Home: NextPage = () => {
  const [_identity, setIdentity] = useState<Identity>();
  const [_username, setUsername] = useState<string>("");
  const [_isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const { signMessage } = useSignMessage({
    async onSettled(signMessageData, error) {
      if (signMessageData) {
        setIsLoading(true);

        const recoveredAddress = await recoverMessageAddress({
          message: _username,
          signature: signMessageData,
        });
        const semaphoreIdentity = new Identity(signMessageData);
        console.log(semaphoreIdentity);
        console.log(semaphoreIdentity.toString());
        console.log(semaphoreIdentity.commitment);

        try {
          const semaphoreIdentity = new Identity(signMessageData);
          const response = await fetch("api/identity/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: recoveredAddress,
              commitment: semaphoreIdentity.commitment.toString(),
              username: _username,
            }),
          });

          if (response.status === 200) {
            const data = await response.json();

            console.log(data);

            console.log(`Your identity was saved 🎉`);
          } else {
            const data = await response.json();
            console.log(data);
            console.log("RESPONSE ERROR!!!", response);
          }

          localStorage.setItem(localStorageTag, semaphoreIdentity.toString());
          setIdentity(semaphoreIdentity);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
      if (error) {
        console.error(error);
      }
    },
  });

  const localStorageTag = process.env.NEXT_PUBLIC_LOCAL_STORAGE_TAG ?? "";

  async function fetchIdentity(commitmentString: string) {
    try {
      const response = await fetch("api/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitment: commitmentString,
        }),
      });
      if (response.status === 200) {
        const { identity } = await response.json();
        console.log(identity);
        setUsername(identity.username);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    const identityString = localStorage.getItem(localStorageTag);

    if (identityString) {
      const semaphoreIdentity = new Identity(identityString);
      setIdentity(semaphoreIdentity);
      const commitmentAsString = semaphoreIdentity.commitment.toString();
      console.log("Your Semaphore identity was retrieved from the browser cache and used to retrieve your profile 👌🏽");
      void fetchIdentity(commitmentAsString);
    } else {
      console.log("Create your Semaphore identity 👆🏽");
    }
  }, [localStorageTag]);

  const renderIdentity = () => {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-semibold text-foreground">Identity Data for: signature + {_username}</div>
          <div>
            <button
              className="btn btn-primary btn-xs rounded-lg"
              onClick={() => signMessage({ message: _username })}
              disabled={_isLoading}
            >
              <span>New</span>
            </button>
          </div>
        </div>

        <div className="w-full">
          <div className="break-words border-2 p-4 border-slate-300 space-y-2 rounded-lg text-left">
            <div className="break-words space-x-2">
              <div>Trapdoor:</div>
              <p className="break-words m-0">{_identity?.trapdoor.toString()}</p>
            </div>
            <div className="space-x-2">
              <div>Nullifier:</div>
              <p className="break-words m-0">{_identity?.nullifier.toString()}</p>
            </div>
            <div className="space-x-2">
              <div>Commitment:</div>
              <p className="break-words m-0">{_identity?.commitment.toString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  function onChangeHandler(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
  }
  return (
    <>
      {/* <div className="flex items-center flex-col flex-grow"> */}
      <div className="flex-grow bg-base-300 w-full px-8 py-12">
        <div className="flex items-center flex-col w-full">
          <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center w-1/2 rounded-3xl space-y-4">
            <h2 className="text-3xl">Login</h2>
            <div className="w-4/5 flex flex-col space-y-2">
              <p className="text-left m-0">Let&apos;s retrieve your identity.</p>
              <div>
                <p className="text-left m-0">It contains:</p>
                <ol className="list-decimal pl-4 space-y-1 text-left">
                  <li>Trapdoor: private, known only by user</li>
                  <li>Nullifier: private, known only by user</li>
                  <li>Commitment: public</li>
                </ol>
              </div>
            </div>
            <form className="w-4/5 flex flex-col items-center py-2">
              <label htmlFor="username" className="form-control w-full">
                <div className="label">
                  <span className="label-text">Username</span>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Type here"
                  className="input input-bordered border-2 w-full rounded-lg h-10 bg-base-200 text-center"
                  defaultValue={_username}
                  onChange={onChangeHandler}
                />
              </label>
            </form>

            <div className="w-4/5 flex justify-center items-center mt-2">
              {/* <div className="flex justify-center w-full py-4" onClick={createIdentity}>
                <button className="btn btn-primary rounded-lg">Retrieve</button>
              </div> */}
              {_identity ? (
                renderIdentity()
              ) : (
                <div className="flex justify-center w-full py-4">
                  <button
                    className="btn btn-primary rounded-lg"
                    onClick={() => signMessage({ message: _username })}
                    disabled={_isLoading}
                  >
                    Get Identity
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center mt-10 w-4/5">
              <Stepper step={1} onNextClick={_identity && (() => router.push("/groups"))} />
            </div>
          </div>
        </div>
      </div>
      {/* </div> */}
    </>
  );
};

export default Home;
