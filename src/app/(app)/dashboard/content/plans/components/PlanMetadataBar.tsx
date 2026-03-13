"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "published", label: "Published" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const FORMAT_OPTIONS = [
  { value: "long-form", label: "Long-form" },
  { value: "short", label: "Short" },
  { value: "tutorial", label: "Tutorial" },
  { value: "stream", label: "Stream" },
  { value: "challenge", label: "Challenge" },
];

interface PlanMetadataBarProps {
  status: string;
  format: string | null;
  priority: string | null;
  onBoard: boolean;
  onStatusChange: (status: string) => void;
  onFormatChange: (format: string | null) => void;
  onPriorityChange: (priority: string) => void;
  onBoardChange: (onBoard: boolean) => void;
  disabled?: boolean;
}

export function PlanMetadataBar({
  status,
  format,
  priority,
  onBoard,
  onStatusChange,
  onFormatChange,
  onPriorityChange,
  onBoardChange,
  disabled,
}: PlanMetadataBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/30 px-4 py-3",
        disabled && "opacity-60 pointer-events-none"
      )}
    >
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Status
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Priority
        </Label>
        <Select
          value={priority ?? "medium"}
          onValueChange={onPriorityChange}
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Format
        </Label>
        <Select
          value={format ?? "none"}
          onValueChange={(v) => onFormatChange(v === "none" ? null : v)}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">
              None
            </SelectItem>
            {FORMAT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Label
          htmlFor="on-board-toggle"
          className="text-xs text-muted-foreground whitespace-nowrap"
        >
          Show on Board
        </Label>
        <Switch
          id="on-board-toggle"
          checked={onBoard}
          onCheckedChange={onBoardChange}
        />
      </div>
    </div>
  );
}
