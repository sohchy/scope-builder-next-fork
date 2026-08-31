'use client';

const STEPS = [
  'Build the journey',
  'Add problems',
  'Add hypothesis & assumptions',
  'Add responses',
  'Add decisions & conclusions',
];

export function ProgressBar() {
  return (
    <div className="flex items-center gap-0 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
      {STEPS.map((label, index) => (
        <div key={label} className="flex items-center">
          {/* Step circle */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                index === 0
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-[10px] font-medium whitespace-nowrap max-w-[80px] text-center leading-tight ${
                index === 0 ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>

          {/* Connector line between steps */}
          {index < STEPS.length - 1 && (
            <div className="w-10 h-px bg-gray-200 mx-2 mb-5" />
          )}
        </div>
      ))}
    </div>
  );
}
