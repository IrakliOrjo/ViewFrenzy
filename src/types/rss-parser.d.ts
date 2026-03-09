import "rss-parser";

declare module "rss-parser" {
  interface Item {
    "media:content"?: { $: { url: string } };
    "media:thumbnail"?: { $: { url: string } };
    "content:encoded"?: string;
  }
}
