"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Input from "@/app/components/ui/BaseInput";
import BaseButton from "@/app/components/ui/BaseButton";
import {
  processDictionaryWords,
  DictionaryWordResult,
  MeaningLanguage,
} from "@/app/apis/dictionary";
import "@/app/styles/pages/dictionary.scss";

const languageLabels: Record<MeaningLanguage, string> = {
  en: "English",
  vi: "Vietnamese",
  ja: "Japanese",
  zh: "Chinese",
};

const parseWordTokens = (value: string) =>
  value
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

type OutputFormat = "cards" | "table" | "tree";

export default function DictionaryPage() {
  const [wordInput, setWordInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [language, setLanguage] = useState<MeaningLanguage>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<DictionaryWordResult[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("cards");

  const canProcess = tags.length > 0 && !loading;

  const dedupeWords = (next: string[]) => {
    const seen = new Set<string>();
    return next.filter((word) => {
      const key = word.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const addTagsFromInput = () => {
    const nextWords = parseWordTokens(wordInput);
    if (nextWords.length === 0) return;

    setTags((prev) => dedupeWords([...prev, ...nextWords]));
    setWordInput("");
    setError("");
  };

  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTagsFromInput();
    }
  };

  const removeTag = (wordToRemove: string) => {
    setTags((prev) => prev.filter((word) => word !== wordToRemove));
  };

  const clearAll = () => {
    setTags([]);
    setWordInput("");
    setResults([]);
    setError("");
  };

  const processWords = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await processDictionaryWords(tags, "CACHE", language);
      setResults(response.results ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to process words. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resultCountLabel = useMemo(() => {
    if (results.length === 0) return "No words processed yet.";
    return `${results.length} words processed`;
  }, [results.length]);

  const resolveMeaning = (item: DictionaryWordResult) => {
    if (item.displayMeanings && item.displayMeanings.length > 0) {
      return item.displayMeanings;
    }

    return item.meanings;
  };

  const exportRows = useMemo(
    () =>
      results.flatMap((item) => {
        const meanings = resolveMeaning(item);

        if (meanings.length === 0) {
          return [
            {
              Word: item.word,
              Meaning: "",
              Source: item.source,
              Entries: item.totalEntries,
            },
          ];
        }

        return meanings.map((meaning, index) => ({
          Word: index === 0 ? item.word : "",
          Meaning: meaning,
          Source: index === 0 ? item.source : "",
          Entries: index === 0 ? item.totalEntries : "",
        }));
      }),
    [results]
  );

  const handleDownloadExcel = () => {
    if (exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dictionary");
    XLSX.writeFile(workbook, `dictionary-${language}.xlsx`);
  };

  const handleDownloadPdf = () => {
    if (exportRows.length === 0) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Dictionary Export", 40, 36);

    autoTable(doc, {
      startY: 52,
      head: [["Word", "Meaning", "Source", "Entries"]],
      body: exportRows.map((row) => [
        String(row.Word ?? ""),
        String(row.Meaning ?? ""),
        String(row.Source ?? ""),
        String(row.Entries ?? ""),
      ]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`dictionary-${language}.pdf`);
  };

  const renderResults = () => {
    if (outputFormat === "table") {
      return (
        <div className="dictionary-tableWrap">
          <table className="dictionary-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Meanings</th>
                <th>Source</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => {
                const meanings = resolveMeaning(item);

                if (meanings.length === 0) {
                  return (
                    <tr key={item.word}>
                      <td>{item.word}</td>
                      <td>
                        <span className="dictionary-meaningChip dictionary-meaningChip--empty">
                          No meaning found
                        </span>
                      </td>
                      <td>{item.source}</td>
                      <td>{item.totalEntries}</td>
                    </tr>
                  );
                }

                return meanings.map((meaning, meaningIndex) => (
                  <tr key={`${item.word}-${meaningIndex}`}>
                    <td>{meaningIndex === 0 ? item.word : ""}</td>
                    <td>
                      <span className="dictionary-meaningChip">{meaning}</span>
                    </td>
                    <td>{meaningIndex === 0 ? item.source : ""}</td>
                    <td>{meaningIndex === 0 ? item.totalEntries : ""}</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (outputFormat === "tree") {
      return (
        <div className="dictionary-tree">
          {results.map((item) => {
            const meanings = resolveMeaning(item);

            return (
              <div key={item.word} className="dictionary-tree__node">
                <h3>{item.word}</h3>
                <p>Source: {item.source}</p>
                <ul>
                  {meanings.length > 0 ? (
                    meanings.map((meaning) => (
                      <li key={`${item.word}-${meaning}`}>
                        <span className="dictionary-meaningChip">{meaning}</span>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span className="dictionary-meaningChip dictionary-meaningChip--empty">
                        No meaning found
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      );
    }

    return results.map((item) => {
      const meanings = resolveMeaning(item);

      return (
        <article key={item.word} className="dictionary-card">
          <h3>{item.word}</h3>
          <p className="dictionary-card__source">Source: {item.source}</p>
          <div className="dictionary-card__meanings">
            {meanings.length > 0 ? (
              meanings.map((meaning, index) => (
                <span key={`${item.word}-${index}`} className="dictionary-meaningChip">
                  {meaning}
                </span>
              ))
            ) : (
              <span className="dictionary-meaningChip dictionary-meaningChip--empty">
                No meaning found
              </span>
            )}
          </div>
        </article>
      );
    });
  };

  return (
    <main className="dictionary-page">
      <section className="dictionary-panel">
        <header className="dictionary-panel__header">
          <h1>Dictionary</h1>
          <p>
            Add words as tags, choose meaning language, then press Process.
          </p>
        </header>

        <div className="dictionary-panel__controls">
          <div className="dictionary-panel__wordInput">
            <Input
              type="text"
              placeholder="Type words and press Enter or comma"
              value={wordInput}
              onChange={(event) => setWordInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <BaseButton onClick={addTagsFromInput}>Add</BaseButton>
          </div>

          <div className="dictionary-panel__toolbar">
            <label htmlFor="meaning-language">Meaning Language</label>
            <select
              id="meaning-language"
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value as MeaningLanguage)
              }
            >
              {Object.entries(languageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label htmlFor="output-format">Output View</label>
            <select
              id="output-format"
              value={outputFormat}
              onChange={(event) =>
                setOutputFormat(event.target.value as OutputFormat)
              }
            >
              <option value="cards">Card View</option>
              <option value="table">Table View</option>
              <option value="tree">Tree View</option>
            </select>

            <BaseButton className="p-3 border border-gray-300 rounded-lg bg-blue-500" onClick={processWords} disabled={!canProcess}>
              {loading ? "Processing..." : "Process"}
            </BaseButton>

            <BaseButton className="dictionary-clearButton p-3 border border-gray-300 rounded-md" onClick={clearAll} disabled={tags.length === 0 && results.length === 0 && wordInput.trim() === ""} > 
              Clear
            </BaseButton>

            <BaseButton
              className="dictionary-exportButton p-3 border border-gray-300 rounded-md"
              onClick={handleDownloadExcel}
              disabled={results.length === 0}
            >
              Download Excel
            </BaseButton>

            <BaseButton
              className="dictionary-exportButton p-3 border border-gray-300 rounded-md"
              onClick={handleDownloadPdf}
              disabled={results.length === 0}
            >
              Download PDF
            </BaseButton>
          </div>
        </div>

        <div className="dictionary-tags">
          {tags.length === 0 ? (
            <p className="dictionary-empty">No tags yet.</p>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="dictionary-tag"
                onClick={() => removeTag(tag)}
                title="Remove tag"
              >
                <span>{tag}</span>
                <span aria-hidden="true">x</span>
              </button>
            ))
          )}
        </div>

        <div className="dictionary-results">
          <p className="dictionary-results__meta">{resultCountLabel}</p>
          {error && <p className="dictionary-results__error">{error}</p>}

          {renderResults()}
        </div>
      </section>
    </main>
  );
}
