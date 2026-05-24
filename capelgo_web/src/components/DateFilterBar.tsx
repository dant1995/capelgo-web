import React from 'react';
import { Calendar } from 'lucide-react';

export interface DateFilterPreset {
  label: string;
  days: number;
}

const PRESETS: DateFilterPreset[] = [
  { label: 'Hoje', days: 1 },
  { label: '3 Dias', days: 3 },
  { label: '7 Dias', days: 7 },
  { label: '15 Dias', days: 15 },
  { label: '30 Dias', days: 30 },
  { label: '90 Dias', days: 90 },
];

interface DateFilterBarProps {
  selectedDays: number;
  onChange: (days: number) => void;
  showCustom?: boolean;
}

export default function DateFilterBar({ selectedDays, onChange, showCustom }: DateFilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={14} className="text-gray-400" />
      {PRESETS.map(p => (
        <button
          key={p.days}
          onClick={() => onChange(p.days)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
            selectedDays === p.days
              ? 'bg-shopee-orange text-white shadow-sm'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
