"use client";

import { useState } from "react";
import { Room } from "@/components/Room";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { Badge } from "@/components/ui/badge";

const VIEW_OPTIONS = [
  "Products & Services",
  "Gain Creators",
  "Pain Relievers",
  "Gains",
  "Customer Jobs",
  "Pains",
];

export default function MultiCanvas({
  orgId,
  example,
}: {
  orgId?: string | null;
  example?: boolean;
}) {
  const [shownCanvases, setShownCanvases] = useState<string[]>(VIEW_OPTIONS);

  const shownCount = shownCanvases.length;

  const getGridClassname = () => {
    if (shownCount === 1) return "grid-cols-1";
    if (shownCount === 2) return "grid-cols-2";
    if (shownCount === 3) return "grid-cols-3";
    if (shownCount === 4) return "grid-cols-2";
    if (shownCount === 5) return "grid-cols-3";
    if (shownCount === 6) return "grid-cols-3";
    return "grid-cols-3";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 bg-white flex flex-row gap-4 items-center">
        <h3 className="pl-2 font-semibold">View Panel</h3>
        <div className="flex flex-row gap-2">
          {VIEW_OPTIONS.map((option) => (
            <div
              key={option}
              className="flex flex-row gap-4 items-center border-r border-r-gray-300 pr-4 pl-4"
            >
              <Checkbox
                checked={shownCanvases.includes(option)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShownCanvases([...shownCanvases, option]);
                  } else {
                    setShownCanvases(
                      shownCanvases.filter((item) => item !== option),
                    );
                  }
                }}
              />
              <Label>{option}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className={`flex-1 bg-white grid gap-2 p-2 ${getGridClassname()}`}>
        {shownCanvases.includes("Products & Services") && (
          <div className="border-2 relative">
            <Badge className="absolute z-50 top-1 left-1">
              Products & Services
            </Badge>
            <Room
              roomId={`value-proposition-products-services-${orgId}${example ? "-example" : ""}`}
            >
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                valuePropCanvasMode
              />
            </Room>
          </div>
        )}

        {shownCanvases.includes("Gain Creators") && (
          <div className="border-2 relative">
            <Badge className="absolute z-50 top-1 left-1">Gain Creators</Badge>
            <Room
              roomId={`value-proposition-gain-creators-${orgId}${example ? "-example" : ""}`}
            >
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                valuePropCanvasMode
              />
            </Room>
          </div>
        )}

        {shownCanvases.includes("Pain Relievers") && (
          <div className="border-2 relative">
            <Badge className="absolute z-50 top-1 left-1">Pain Relievers</Badge>
            <Room
              roomId={`value-proposition-pain-relievers-${orgId}${example ? "-example" : ""}`}
            >
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                valuePropCanvasMode
              />
            </Room>
          </div>
        )}

        {shownCanvases.includes("Gains") && (
          <div className="border-2 relative">
            <Badge className="absolute z-50 top-1 left-1">Gains</Badge>
            <Room
              roomId={`value-proposition-gains-${orgId}${example ? "-example" : ""}`}
            >
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                valuePropCanvasMode
                editable={!example}
              />
            </Room>
          </div>
        )}

        {shownCanvases.includes("Customer Jobs") && (
          <div className="border-2 relative">
            <Badge className="absolute z-50 top-1 left-1">Customer Jobs</Badge>
            <Room
              roomId={`value-proposition-customer-jobs-${orgId}${example ? "-example" : ""}`}
            >
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                valuePropCanvasMode
              />
            </Room>
          </div>
        )}

        {shownCanvases.includes("Pains") && (
          <div className="border-2 relative">
            <Badge className="absolute z-50 top-1 left-1">Pains</Badge>
            <Room
              roomId={`value-proposition-pains-${orgId}${example ? "-example" : ""}`}
            >
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                valuePropCanvasMode
              />
            </Room>
          </div>
        )}
      </div>
    </div>
  );
}
