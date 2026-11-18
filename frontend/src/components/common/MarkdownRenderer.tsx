import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, secure Markdown renderer specifically designed for Clinical Navigator.
 * Formats clinical headings, numbered recommendations, bullet points, bold terms,
 * blockquotes, and units without external heavy dependencies or security vulnerabilities.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by double newlines into blocks (paragraphs, headers, lists)
  const rawBlocks = content.split(/\n{2,}/);

  const renderInline = (text: string): React.ReactNode[] => {
    // Process bold (**text**), code (`text`), italic (*text*)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex matching **bold**, `code`, or *italic*
    const inlineRegex = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/;

    while (remaining) {
      const match = remaining.match(inlineRegex);
      if (!match || match.index === undefined) {
        parts.push(remaining);
        break;
      }

      if (match.index > 0) {
        parts.push(remaining.substring(0, match.index));
      }

      const fullMatch = match[0];
      if (fullMatch.startsWith('**')) {
        parts.push(
          <strong key={`b-${keyIdx++}`} className="font-bold text-[#1b122e]">
            {match[2]}
          </strong>
        );
      } else if (fullMatch.startsWith('`')) {
        parts.push(
          <code
            key={`c-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded bg-purple-50 text-[#5b21b6] font-mono text-[11px] border border-purple-100"
          >
            {match[3]}
          </code>
        );
      } else if (fullMatch.startsWith('*')) {
        parts.push(
          <em key={`i-${keyIdx++}`} className="italic text-[#443859]">
            {match[4]}
          </em>
        );
      }

      remaining = remaining.substring(match.index + fullMatch.length);
    }

    return parts;
  };

  return (
    <div className={`space-y-3 text-xs sm:text-sm text-[#2a1d3f] leading-relaxed ${className}`}>
      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Header 3: ### Title
        if (trimmed.startsWith('### ')) {
          const headerText = trimmed.replace(/^###\s+/, '');
          return (
            <h3
              key={blockIdx}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#5b21b6] pt-3 pb-1 border-b border-purple-100/70 flex items-center gap-2"
            >
              <span>{renderInline(headerText)}</span>
            </h3>
          );
        }

        // Header 4: #### Title
        if (trimmed.startsWith('#### ')) {
          const headerText = trimmed.replace(/^####\s+/, '');
          return (
            <h4 key={blockIdx} className="text-xs sm:text-sm font-bold text-[#1b122e] pt-2 pb-0.5">
              {renderInline(headerText)}
            </h4>
          );
        }

        // Blockquote: > text
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((l) => l.replace(/^>\s?/, ''))
            .join(' ');
          return (
            <blockquote
              key={blockIdx}
              className="border-l-3 border-[#5b21b6] pl-3 py-1.5 my-2 bg-purple-50/40 rounded-r-xl text-xs text-[#4b3d63] italic"
            >
              {renderInline(quoteLines)}
            </blockquote>
          );
        }

        // Numbered List: 1. Item ...
        const lines = trimmed.split('\n');
        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line.trim()));
        if (isNumberedList) {
          return (
            <ol key={blockIdx} className="list-decimal pl-5 space-y-1.5 my-2">
              {lines.map((line, lineIdx) => {
                const itemText = line.trim().replace(/^\d+\.\s+/, '');
                return (
                  <li key={lineIdx} className="pl-1 leading-normal">
                    {renderInline(itemText)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Bullet List: - Item or * Item
        const isBulletList = lines.every((line) => /^[-*]\s+/.test(line.trim()));
        if (isBulletList) {
          return (
            <ul key={blockIdx} className="list-disc pl-5 space-y-1.5 my-2">
              {lines.map((line, lineIdx) => {
                const itemText = line.trim().replace(/^[-*]\s+/, '');
                return (
                  <li key={lineIdx} className="pl-1 leading-normal">
                    {renderInline(itemText)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Mixed lines (e.g. paragraph with some internal bullets)
        return (
          <div key={blockIdx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;

              if (/^[-*]\s+/.test(trimmedLine)) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-3">
                    <span className="text-[#5b21b6] font-bold select-none">•</span>
                    <span className="leading-relaxed">
                      {renderInline(trimmedLine.replace(/^[-*]\s+/, ''))}
                    </span>
                  </div>
                );
              }

              if (/^\d+\.\s+/.test(trimmedLine)) {
                const num = trimmedLine.match(/^(\d+)\./)?.[1] || `${lineIdx + 1}`;
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-3">
                    <span className="text-[#5b21b6] font-bold select-none text-[11px] mt-0.5">
                      {num}.
                    </span>
                    <span className="leading-relaxed">
                      {renderInline(trimmedLine.replace(/^\d+\.\s+/, ''))}
                    </span>
                  </div>
                );
              }

              return (
                <p key={lineIdx} className="leading-relaxed">
                  {renderInline(trimmedLine)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

