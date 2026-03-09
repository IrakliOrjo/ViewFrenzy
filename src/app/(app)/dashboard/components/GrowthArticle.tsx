import { BookOpen, ExternalLink, Newspaper } from "lucide-react";
import type { IGrowthArticle } from "@/types/dashboard";
import { formatRelativeTime } from "@/helpers/date";

interface GrowthArticleProps {
  article: IGrowthArticle | null;
}

export function GrowthArticle({ article }: GrowthArticleProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="size-5 text-primary" />
        <h3 className="font-bold">Growth Reading</h3>
      </div>

      {article ? (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-3 flex items-center justify-center">
            {article.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Newspaper className="size-8 text-muted-foreground" />
            )}
          </div>

          <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h4>

          {article.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {article.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">
              {article.source} &middot; {formatRelativeTime(new Date(article.publishedAt))}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Read article
              <ExternalLink className="size-3" />
            </span>
          </div>
        </a>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Newspaper className="size-8 mb-2" />
          <p className="text-sm">No articles available</p>
        </div>
      )}
    </div>
  );
}
