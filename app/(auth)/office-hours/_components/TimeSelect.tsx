"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeOption } from "@/lib/officeHoursUtils";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TimeOption[];
  disabled?: boolean;
}

export default function TimeSelect({
  value,
  onChange,
  options,
  disabled,
}: TimeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[110px] shrink-0 h-8 text-xs border border-gray-200 rounded-lg">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
