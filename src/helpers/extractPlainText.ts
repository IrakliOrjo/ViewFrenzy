interface TiptapNode {
  type?: string;
  text?: string;
  content?: TiptapNode[];
}

/**
 * Extracts plain text from Tiptap JSON content.
 * Walks the node tree recursively and concatenates all text nodes.
 */
export function extractPlainText(
  content: unknown,
  maxLength = 100
): string {
  if (!content || typeof content !== "object") return "";

  const node = content as TiptapNode;
  const parts: string[] = [];

  function walk(n: TiptapNode) {
    if (n.text) {
      parts.push(n.text);
    }
    if (n.content) {
      for (const child of n.content) {
        walk(child);
      }
    }
  }

  walk(node);
  const full = parts.join(" ").replace(/\s+/g, " ").trim();

  if (full.length <= maxLength) return full;
  return full.slice(0, maxLength - 3) + "...";
}
