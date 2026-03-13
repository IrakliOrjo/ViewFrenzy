import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractPlainText } from "@/helpers/extractPlainText";
import { formatDistanceToNow } from "date-fns";
import type { Idea } from "@/generated/prisma/client";

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const preview = extractPlainText(idea.content);

  return (
    <Link href={`/dashboard/content/ideas/${idea.id}`}>
      <Card className="group transition-colors hover:border-primary/30 hover:shadow-sm cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {idea.title || "Untitled"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preview && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {preview}
            </p>
          )}
          <p className="text-xs text-muted-foreground/60">
            {formatDistanceToNow(idea.updatedAt, { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
