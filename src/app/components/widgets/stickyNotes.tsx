import React, { useState, useRef, useEffect } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/stickyNotes.scss";
import WidgetProps from "@/app/types/widget";

export default function StickyNotesWidgets(props: WidgetProps) {
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const TAGS = [
    {
      label: "Urgent",
      color: "rgb(255 169 169)",
      bg: "#FF4C38",
      dc: "rgb(123 0 0)",
      textColor: "#fff",
    }, // light red
    {
      label: "Chill",
      color: "rgb(129 227 255)",
      bg: "#50B2FC",
      dc: "rgb(0 84 112)",
      textColor: "#fff",
    }, // light blue
    {
      label: "ASAP",
      color: " #faad14",
      bg: "#FED800",
      dc: "#705f00",
      textColor: "black",
    }, // light yellow
  ];

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) => (prev[0] === tag ? [] : [tag]));
    setDropdownOpen(false);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟡 Get background color from selected tag
  const selectedTag = TAGS.find((tag) => tag.label === selectedTags[0]);
  const backgroundColor = selectedTag?.bg || "#FED800";

  return (
    <BaseWidget title="Sticky Note" {...props}>
      <div className="stickyNote__container" style={{ backgroundColor }}>
        <div className="stickyNote__container__tags__container">
          <div
            className="stickyNote__container__tags__container__selected"
            onClick={() => setDropdownOpen((prev) => !prev)}
            ref={dropdownRef}
          >
            {selectedTags.length === 0 ? (
              <span className="tag-placeholder">+ Add tag</span>
            ) : (
              selectedTags.map((tagLabel) => {
                const tag = TAGS.find((t) => t.label === tagLabel);
                return (
                  <span
                    key={tagLabel}
                    className="stickyNote__container__tags__container__tag selected"
                    style={{ backgroundColor: tag?.color }}
                  >
                    {tagLabel}
                  </span>
                );
              })
            )}

            {dropdownOpen && (
              <div className="stickyNote__container__tags__container__dropdown">
                {TAGS.map((tag) => (
                  <span
                    key={tag.label}
                    className={`stickyNote__container__tags__container__tag ${
                      selectedTags.includes(tag.label) ? "selected" : ""
                    }`}
                    style={{ backgroundColor: tag.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagClick(tag.label);
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea
          value={note}
          onChange={handleNoteChange}
          placeholder="Write your note here..."
          style={{
            color: selectedTag?.textColor || "black",
          }}
        />

        <div className="stickyNote__container__decor">
          <div
            className="DecorShape"
            style={{
              borderLeft: `50px solid ${selectedTag?.dc || "#705f00"}`,
            }}
          ></div>
        </div>
      </div>
    </BaseWidget>
  );
}
