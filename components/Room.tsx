"use client";

import { ReactNode } from "react";
import {
  RoomProvider,
  LiveblocksProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList } from "@liveblocks/client";
import { LoadingText } from "@/components/ui/loader";

interface RoomProps {
  roomId: string;
  initialStorage?: any;
  children: ReactNode;
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <LiveblocksProvider
      throttle={16}
      // publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
      authEndpoint={"/api/liveblocks-auth"}
    >
      <RoomProvider
        id={`${roomId}`}
        initialStorage={{
          shapes: new LiveList([]),
          comments: new LiveList([]),
          connections: new LiveList([]),
          journeyNodes: new LiveList([]),
          journeyEdges: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={
          <div className="flex items-center justify-center min-h-[200px]">
            <LoadingText text="Loading room..." />
          </div>
        }>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
