import { Sparkles } from "lucide-react";
import { ActionButton } from "@/components/Common/ActionButton";
import type { IMockCoachNote } from "@/types/dashboard";

interface CoachNoteProps {
  note: IMockCoachNote;
}

export function CoachNote({ note }: CoachNoteProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-primary/15">
      {/* Gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/60 via-amber-400/60 to-primary/20" />

      {/* Decorative background sparkle */}
      <Sparkles className="absolute top-6 right-6 size-24 text-primary opacity-[0.04] transition-all duration-500 group-hover:scale-125 group-hover:opacity-[0.07] group-hover:rotate-12" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
        <h3 className="text-lg font-bold">Coach&apos;s Note</h3>
      </div>

      {/* Message */}
      <p className="text-muted-foreground leading-relaxed mb-6">
        {note.message}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4">
        <ActionButton>View Full Insight</ActionButton>
        <span className="text-xs text-muted-foreground">
          Analyzed {note.analyzedAt}
        </span>
      </div>
    </div>
  );
}
