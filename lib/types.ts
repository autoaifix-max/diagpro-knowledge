export type Brand = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
};

export type Source = {
  id: string;
  brand_id: string | null;
  name: string;
  url: string;
  source_type: "forum" | "youtube" | "diagnostic_site" | "guide";
  specialty: string | null;
  language: string;
  created_at: string;
};

export type ContentChunkMatch = {
  id: string;
  source_id: string | null;
  brand_id: string | null;
  title: string | null;
  content: string;
  video_url: string | null;
  metadata: Record<string, unknown>;
  similarity: number;
};

export type AskResponse = {
  answer: string;
  sources: {
    title: string | null;
    url: string;
    name: string;
  }[];
};
