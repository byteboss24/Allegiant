import { atom } from "jotai";
import { Agent } from "@/lib/props";

export const isActiveAtom = atom(false);
export const agentsAtom = atom<Agent[]>([]);
export const selectedAgentIdAtom = atom<number>(null);
export const selectedAgentAtom = atom<Agent>(null);

