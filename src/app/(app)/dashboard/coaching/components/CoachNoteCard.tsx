import { Sparkles } from "lucide-react";
import type { CoachNote } from "@/generated/prisma/client";
import { NOTE_TYPE_LABELS } from "@/app/(app)/dashboard/coaching/data/coachNoteData";

interface CoachNoteCardProps {
  note: CoachNote | null;
}

export function CoachNoteCard({ note }: CoachNoteCardProps) {
  return (
    <div className="bg-card p-8 rounded-xl shadow-sm border border-primary/5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/60 via-amber-400/60 to-primary/20" />
      <Sparkles className="absolute top-8 right-8 size-32 text-primary opacity-[0.04]" />

      <div className="flex items-center gap-2 mb-5">
        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Coach&apos;s Note</h2>
          {note && (
            <span className="text-xs text-muted-foreground">
              {NOTE_TYPE_LABELS[note.type] ?? note.type}
            </span>
          )}
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed text-base">
        {note?.message ??
          "No coaching insight yet. Your first note will appear after the daily coaching run."}
      </p>
    </div>
  );
}
