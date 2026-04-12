export type MeaningLanguage = "en" | "vi" | "ja" | "zh" | "fr" | "nl";

export interface DictionaryEntry {
  id: string;
  word: string;
  meaning: string | null;
  meaningEn?: string | null;
  meaningFr?: string | null;
  meaningNl?: string | null;
  meaningVi?: string | null;
  meaningJa?: string | null;
  meaningZh?: string | null;
  pronunciation: string | null;
  example: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  set: string | null;
  topicId: string;
  topic: string | null;
  category: string | null;
}

export interface DictionaryWordResult {
  word: string;
  canonicalWord?: string;
  source: string;
  language?: MeaningLanguage;
  exists: boolean;
  totalEntries: number;
  meanings: string[];
  displayMeanings?: string[];
  text: string;
  entries: DictionaryEntry[];
}

export interface DictionaryCacheResponse {
  saveMissing: boolean;
  sourceLanguage?: MeaningLanguage;
  targetLanguage?: MeaningLanguage;
  count: number;
  results: DictionaryWordResult[];
}

export const processDictionaryWords = async (
  words: string[],
  set = "CACHE",
  sourceLanguage: MeaningLanguage = "en",
  targetLanguage: MeaningLanguage = "en"
): Promise<DictionaryCacheResponse> => {
  // Use language-specific endpoint for cleaner routing and better optimization per language
  const response = await fetch(`/api/vocab/cache/${sourceLanguage}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      words,
      saveMissing: true,
      set,
      targetLanguage,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Failed to process dictionary words");
  }

  return data;
};
