import {
  createClient,
  LiveList,
  LiveMap,
  LiveObject,
} from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { decode } from "base-64";

window.addEventListener = (x: any) => x
window.removeEventListener = (x: any) => x

const PUBLIC_KEY =
  "pk_dev_bMLjei0FFPTcpaOaPjdL1XrDtWL-FSQV5QFmzsjqpTEZCkI_3VQdqZlmZWFqhdyX";

const client = createClient({
  publicApiKey: PUBLIC_KEY,
  polyfills: {
    atob: decode,
  },
});

type Shape = LiveObject<{
  x: number;
  y: number;
  fill: string;
}>;

type Presence = {
  selectedShape: string | null;
};

type Storage = {
  shapes: LiveMap<string, Shape>;
};

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      selectedShape: string | null;
    };
    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      shapes: LiveMap<string, Shape>;
    };
  }
}

export const {
  RoomProvider,
  useOthers,
  useStorage,
  useMutation,
  useUpdateMyPresence,
} = createRoomContext<Presence, Storage>(client);
