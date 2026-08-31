// Define Liveblocks types for your application

import { LiveList, LiveObject } from "@liveblocks/client";

export interface JourneyNodeStorage {
  id: string;
  type: 'trigger' | 'action' | 'split_route';
  content: string;
  stakeholderIds: number[];
  problems: Array<{
    id: string;
    description: string;
    type: string;
    painOrGain: "pain" | "gain";
    questions: Array<{
      bankQuestionId: string;
      answer: string | string[];
      source: string;
      confidence: number;
      isHypothesis: boolean;
    }>;
  }>;
  solutions: Array<{
    id: string;
    // The problem this solution belongs to. Legacy rooms wrote node-scoped
    // solutions without this field; readers treat those as the first problem's.
    problemId?: string;
    description: string;
    type: string;
    relieverOrCreator: "reliever" | "creator";
    questions: Array<{
      bankQuestionId: string;
      answer: string | string[];
      source: string;
      confidence: number;
    }>;
  }>;
  conclusions: Array<{
    id: string;
    status: "testing" | "validated" | "invalidated";
    content: string;
  }>;
  /** Logical delete marker (ISO timestamp). Set = the node and the edge that
   * connects it are hidden everywhere; the data itself is never removed. */
  deletedAt?: string | null;
}

export interface JourneyEdgeStorage {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  /** User-set branch label. Absent or empty falls back to the derived "Option n". */
  label?: string;
}

// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Example, real-time cursor coordinates
      // cursor: { x: number; y: number };
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Example, a conflict-free list
      // animals: LiveList<string>;
      shapes: LiveList<LiveObject<any>>;
      comments: LiveList<LiveObject<any>>;
      connections: LiveList<LiveObject<any>>;
      journeyNodes: LiveList<LiveObject<any>>;
      journeyEdges: LiveList<LiveObject<any>>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        // Example properties, for useSelf, useUser, useOthers, etc.
        // name: string;
        // avatar: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};
    // Example has two events, using a union
    // | { type: "PLAY" }
    // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

export {};
