export type MeaningLanguage = "en" | "vi" | "ja" | "zh" | "fr" | "nl";
export type DictionaryEngine = "legacy" | "beta";

export interface DictionaryEntry {
  id: string;
  word: string;
  wordVi?: string | null;
  wordJa?: string | null;
  wordZh?: string | null;
  wordFr?: string | null;
  wordNl?: string | null;
  wordType?: string | null;
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
  equivalentWord?: string;
  source: string;
  language?: MeaningLanguage;
  exists: boolean;
  totalEntries: number;
  meanings: string[];
  displayMeanings?: string[];
  wordTypes?: string[];
  topic?: string | null;
  category?: string | null;
  topics?: string[];
  categories?: string[];
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
  targetLanguage: MeaningLanguage = "en",
  engine: DictionaryEngine = "legacy"
): Promise<DictionaryCacheResponse> => {
  const endpoint = engine === "beta" ? "/api/vocab/beta/cache" : "/api/vocab/cache";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      words,
      saveMissing: true,
      set,
      sourceLanguage,
      targetLanguage,
    }),
  });

  const responseText = await response.text();
  let data: DictionaryCacheResponse & { error?: string } | null = null;

  if (responseText.trim().length > 0) {
    try {
      data = JSON.parse(responseText) as DictionaryCacheResponse & {
        error?: string;
      };
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        responseText.trim() ||
        "Failed to process dictionary words"
    );
  }

  if (!data) {
    throw new Error("Invalid JSON response from dictionary endpoint");
  }

  return data;
};
