'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Prompt } from './prompts';

export interface GuestEntry {
  date: string;
  promptText: string;
  promptType: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
}

interface GuestState {
  isGuest: boolean;
  entries: GuestEntry[];
  setGuest: (v: boolean) => void;
  saveEntry: (entry: GuestEntry) => void;
  getEntryByDate: (date: string) => GuestEntry | undefined;
  getEntries: () => GuestEntry[];
  clearAll: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      isGuest: false,
      entries: [],

      setGuest: (v) => set({ isGuest: v }),

      saveEntry: (entry) => set(state => {
        const filtered = state.entries.filter(e => e.date !== entry.date);
        return { entries: [...filtered, entry] };
      }),

      getEntryByDate: (date) => get().entries.find(e => e.date === date),

      getEntries: () => get().entries.sort((a, b) => b.date.localeCompare(a.date)),

      clearAll: () => set({ entries: [], isGuest: false }),
    }),
    {
      name: 'six-things-guest',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
