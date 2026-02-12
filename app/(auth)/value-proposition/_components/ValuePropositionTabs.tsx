// components/workspace/SimpleTabs.tsx
"use client";

import { toast } from "sonner";
import React, { useState } from "react";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { LoadingText } from "@/components/ui/loader";
import {
  createWorkspaceRoom,
  renameWorkspaceRoom,
} from "@/services/workspaces";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ValuePropKanbanView from "@/components/KanbanModule/ValuePropKanbanView";

export type SimpleTab = { id: string; title: string; roomId: string };

export default function ValuePropositionTabsView({ rooms }: { rooms: any[] }) {
  const [tabs, setTabs] = useState(rooms);
  const [activeRoomId, setActiveRoom] = useState<string | null>(
    rooms[rooms.length - 1].room_id
  );

  const isLatestVersion = (activeRoomId: string) => {
    const latestRoom = rooms[rooms.length - 1];
    return latestRoom.room_id === activeRoomId;
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Tabs bar (simple, pill-like; matches your mock vibe) */}
      <div className=" bg-[#ECECEF] h-8">
        <div className="flex gap-2 box-border items-center h-full">
          <div className="flex h-full items-end gap-2 overflow-x-auto px-1">
            {rooms.map((t) => {
              const active = t.room_id === activeRoomId;

              if (active) {
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveRoom(t.room_id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="font-semibold cursor-pointer text-[10px] bg-[#F9F9F9] px-3.5 h-6 rounded-t-sm flex items-center"
                  >
                    {`Version ${t.version_number}`}
                  </button>
                );
              }

              return (
                <button
                  key={t.id}
                  onClick={() => setActiveRoom(t.room_id)}
                  className="font-semibold cursor-pointer text-[10px] text-[#111827]  opacity-60 px-3.5 h-6 rounded-t-sm flex items-center"
                >
                  {`Version ${t.version_number}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full">
        {activeRoomId ? (
          <div className="absolute inset-0 w-full h-full">
            <Room roomId={activeRoomId}>
              {/* <InfiniteCanvas
                toolbarOptions={{
                  answer: false,
                  question: false,
                  card: true,
                  text: true,
                  rectangle: true,
                  ellipse: true,
                  feature: false,
                  interview: false,
                  table: false,
                }}
                editable={isLatestVersion(activeRoomId)}
              /> */}
              <Tabs defaultValue="canvas-view" className="w-full h-full">
                <TabsList className="ml-1 mt-2">
                  <TabsTrigger value="canvas-view">Canvas View</TabsTrigger>
                  <TabsTrigger value="kanban-view">Kanban View</TabsTrigger>
                </TabsList>
                <TabsContent value="canvas-view" className="w-full h-full">
                  <InfiniteCanvas
                    toolbarOptions={{
                      answer: false,
                      question: false,
                      card: true,
                      text: true,
                      rectangle: true,
                      ellipse: true,
                      feature: false,
                      interview: false,
                      table: false,
                    }}
                  />
                </TabsContent>
                <TabsContent
                  value="kanban-view"
                  className="w-full h-full flex overflow-hidden"
                >
                  <ValuePropKanbanView
                    kanbanBoards={[
                      { label: "Jobs to be Done", key: "jobs_to_be_done_card" },
                      { label: "Pains", key: "pains_card" },
                      { label: "Gains", key: "gains_card" },
                    ]}
                  />
                </TabsContent>
              </Tabs>
            </Room>
          </div>
        ) : (
          <div className="p-6 flex items-center justify-center min-h-[200px]">
            <LoadingText text="Loading workspace..." />
          </div>
        )}
      </div>
    </div>
  );
}
