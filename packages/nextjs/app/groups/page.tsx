"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Identity } from "@semaphore-protocol/identity";
import Stepper from "~~/components/stepper";
import { getGroup, getMembersGroup } from "~~/services/bandada";
import { getRoot } from "~~/services/semaphore";
import { useGlobalState } from "~~/services/store/store";

export default function GroupsPage() {
  const router = useRouter();

  // To read the url params for credential groups
  const searchParams = useSearchParams();

  const [_identity, setIdentity] = useState<Identity>();
  const [_isGroupMember, setIsGroupMember] = useState<boolean>(false);
  const [_isLoading, setIsLoading] = useState<boolean>(false);
  const [_renderInfoLoading, setRenderInfoLoading] = useState<boolean>(false);
  const [_users, setUsers] = useState<string[]>([]);

  const currentIdentity = useGlobalState(state => state.currentIdentity);
  //   const localStorageTag = process.env.NEXT_PUBLIC_LOCAL_STORAGE_TAG!;

  const groupId = process.env.NEXT_PUBLIC_BANDADA_GROUP_ID ?? "";

  const getUsers = useCallback(async () => {
    setRenderInfoLoading(true);
    const users = await getMembersGroup(groupId);
    if (users) {
      setUsers(users.reverse());
      setRenderInfoLoading(false);
      return users;
    } else return [];
  }, [groupId]);

  useEffect(() => {
    if (!currentIdentity) {
      router.push("/");
      return;
    }

    const identity = new Identity(currentIdentity);

    setIdentity(identity);

    async function isMember() {
      const users = await getUsers();
      console.log("users", users);
      const answer = users?.includes(identity.commitment.toString());
      console.log("answer", answer);
      setIsGroupMember(answer || false);
    }

    isMember();
  }, [router, getUsers, currentIdentity]);

  // Function for credential groups to update the supabase backend
  const afterJoinCredentialGroup = useCallback(async () => {
    setIsLoading(true);
    const group = await getGroup(groupId);
    if (group === null) {
      alert("Some error ocurred! Group not found!");
      return;
    }
    const groupRoot = await getRoot(groupId, group.treeDepth, group.members);

    try {
      const response = await fetch("api/join-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupRoot: groupRoot.toString(),
        }),
      });

      if (response.status === 200) {
        setIsLoading(false);
        router.push("/groups");
      } else {
        alert(await response.json);
      }
    } catch (error) {
      console.log(error);

      alert("Some error occurred, please try again!");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, router]);

  // useEffect that will be used for credential groups
  useEffect(() => {
    async function execAfterJoinCredentialGroup() {
      const param = searchParams.get("redirect");
      if (param === "true") {
        await afterJoinCredentialGroup();
      }
    }
    execAfterJoinCredentialGroup();
  }, [searchParams, afterJoinCredentialGroup]);

  const joinGroup = async () => {
    setIsLoading(true);

    const commitment = _identity?.commitment.toString();

    try {
      const response = await fetch("api/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          commitment,
        }),
      });

      if (response.status === 200) {
        setIsGroupMember(true);
        const users = await getMembersGroup(groupId);
        if (users) {
          setUsers(users.reverse());
          setRenderInfoLoading(false);
          return users;
        } else return [];
      } else {
        alert(await response.json);
      }
    } catch (error) {
      console.log(error);

      alert("Some error occurred, please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const renderGroup = () => {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-foreground">Current Members: {_users?.length}</div>
          <div>
            <button className="btn btn-primary btn-xs rounded-md" onClick={getUsers}>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center">
          {!_isGroupMember ? (
            <button
              className="btn-primary btn rounded-lg"
              onClick={joinGroup}
              disabled={_isLoading || _isGroupMember || _renderInfoLoading}
            >
              {_isLoading && <div className="loader"></div>}
              <span>Join group</span>
            </button>
          ) : (
            <button className="btn btn-primary rounded-lg">New zkPrescription</button>
          )}
        </div>

        {_renderInfoLoading && (
          <div className="flex justify-center items-center mt-20 gap-2">
            <div className="loader-app"></div>
            <div>Fetching group members</div>
          </div>
        )}

        {_users ? (
          <div className="grid-rows-1 place-content-center">
            <div className="space-y-3 overflow-auto max-h-80  border-2 p-3 border-slate-300 rounded-lg">
              {_users?.map((user, i) => (
                <p key={i} className="break-words text-left">
                  {user}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center mt-20">
            <div className="loader-app"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-grow bg-base-300 w-full px-8 py-12">
      <div className="flex items-center flex-col w-full">
        <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center w-1/2 rounded-3xl space-y-4">
          <div className="flex justify-center items-center">
            <h1 className="text-3xl font-semibold text-foreground">zkPrescription Group</h1>
          </div>
          <div className="flex justify-center items-center w-4/5">{renderGroup()}</div>
          <div className="flex justify-center items-center w-4/5">
            <div className="w-full">
              <Stepper
                step={2}
                onPrevClick={() => router.push("/")}
                onNextClick={
                  _identity && Boolean(_isGroupMember) && !_isLoading ? () => router.push("/proofs") : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
