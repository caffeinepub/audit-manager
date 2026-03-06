import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string; // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number; // px, default 120
  "data-ocid"?: string;
}

const PLACEHOLDER_STYLE_ID = "rich-text-editor-placeholder-style";

function ensurePlaceholderStyle() {
  if (document.getElementById(PLACEHOLDER_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PLACEHOLDER_STYLE_ID;
  style.textContent = `
    .rte-editor:empty::before {
      content: attr(data-placeholder);
      color: var(--muted-foreground, #9ca3af);
      pointer-events: none;
      opacity: 0.6;
      font-size: 0.875rem;
    }
  `;
  document.head.appendChild(style);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = 120,
  "data-ocid": dataOcid,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);

  // Ensure placeholder CSS is injected once
  useEffect(() => {
    ensurePlaceholderStyle();
  }, []);

  // Sync value → editor only when not focused (to avoid cursor jump)
  useEffect(() => {
    const el = editorRef.current;
    if (!el || isFocusedRef.current) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const execCmd = (command: string, val?: string) => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCmd("foreColor", e.target.value);
  };

  const toolbarBtn =
    "inline-flex items-center justify-center h-7 w-7 rounded text-sm font-medium text-foreground/80 hover:bg-secondary hover:text-foreground transition-colors select-none cursor-pointer border-0 bg-transparent";

  return (
    <div
      className="rounded-md border border-border/50 bg-secondary/40 overflow-hidden"
      data-ocid={dataOcid}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-secondary/60 flex-wrap">
        <button
          type="button"
          title="Bold"
          className={toolbarBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("bold");
          }}
        >
          <strong className="text-xs">B</strong>
        </button>
        <button
          type="button"
          title="Italic"
          className={toolbarBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("italic");
          }}
        >
          <em className="text-xs">I</em>
        </button>
        <button
          type="button"
          title="Underline"
          className={toolbarBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("underline");
          }}
        >
          <span className="text-xs underline">U</span>
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Text Color */}
        <label
          title="Text Color"
          className={`${toolbarBtn} relative overflow-hidden`}
          style={{ cursor: "pointer" }}
        >
          <span className="text-xs font-bold leading-none">A</span>
          <input
            type="color"
            defaultValue="#000000"
            onChange={handleColorChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Text Color"
          />
        </label>

        <div className="w-px h-4 bg-border/60 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          title="Bullet List"
          className={toolbarBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("insertUnorderedList");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-label="Bullet List"
            role="img"
          >
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>

        {/* Ordered List */}
        <button
          type="button"
          title="Numbered List"
          className={toolbarBtn}
          onMouseDown={(e) => {
            e.preventDefault();
            execCmd("insertOrderedList");
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-label="Numbered List"
            role="img"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text
              x="2"
              y="8"
              fontSize="7"
              fill="currentColor"
              stroke="none"
              fontWeight="bold"
            >
              1
            </text>
            <text
              x="2"
              y="14"
              fontSize="7"
              fill="currentColor"
              stroke="none"
              fontWeight="bold"
            >
              2
            </text>
            <text
              x="2"
              y="20"
              fontSize="7"
              fill="currentColor"
              stroke="none"
              fontWeight="bold"
            >
              3
            </text>
          </svg>
        </button>
      </div>

      {/* Editable content area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="rte-editor outline-none px-3 py-2 text-sm text-foreground leading-relaxed"
        style={{ minHeight: `${minHeight}px` }}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
      />
    </div>
  );
}
