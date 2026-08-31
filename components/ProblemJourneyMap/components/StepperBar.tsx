'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

type StepStatus = 'done' | 'active' | 'pending';

export interface StepConfig {
  label: string;
  status: StepStatus;
  /** Custom content rendered below the label. Falls back to the default status indicator. */
  content?: React.ReactNode;
}

// 3% arrow depth — between the too-thick 4% and the invisible 2%.
const START_CLIP  = 'polygon(0% 0%, 97% 0%, 100% 50%, 97% 100%, 0% 100%)';
const MIDDLE_CLIP = 'polygon(0% 0%, 97% 0%, 100% 50%, 97% 100%, 0% 100%, 3% 50%)';
const LAST_CLIP   = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 3% 50%)';
const OVERLAP_PX  = 6;

const DEFAULT_STEPS: StepConfig[] = [
  { label: 'Build the journey',           status: 'done'    },
  { label: 'Add problems',                 status: 'active'  },
  { label: 'Add hypothesis & assumptions', status: 'pending' },
  { label: 'Add responses',               status: 'pending' },
  { label: 'Add decisions & conclusions',  status: 'pending' },
];

interface StepperBarProps {
  steps?: StepConfig[];
}

export function StepperBar({ steps = DEFAULT_STEPS }: StepperBarProps) {
  const lastIndex = steps.length - 1;

  return (
    <div className="flex w-full border-b border-[#E4E5ED]">
      {steps.map((step, index) => {
        const isFirst = index === 0;
        const isLast  = index === lastIndex;
        const clipPath = isFirst ? START_CLIP : isLast ? LAST_CLIP : MIDDLE_CLIP;

        return (
          <div
            key={step.label}
            className="relative flex flex-1 flex-col items-center justify-between bg-white py-3 px-8 gap-1"
            style={{ clipPath, zIndex: lastIndex - index, marginLeft: isFirst ? 0 : -OVERLAP_PX }}
          >
            <span
              className={`text-sm font-medium whitespace-nowrap ${
                step.status === 'done'   ? 'text-gray-600' :
                step.status === 'active' ? 'text-indigo-700 font-semibold' :
                                           'text-gray-400'
              }`}
            >
              {step.label}
            </span>

            {step.content ?? (
              <>
                {step.status === 'done' && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-green-500" />
                    <span className="text-xs text-green-500">Done</span>
                  </div>
                )}
                {step.status === 'active' && (
                  <div className="h-[2px] w-3/4 rounded-full bg-indigo-600" />
                )}
                {step.status === 'pending' && (
                  <span className="text-xs text-gray-400">Not started</span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
