import React from "react";

// Regex patterns for different link types
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
const PARTIAL_URL_REGEX =
  /(?<![a-zA-Z0-9@:%._\+~#=])www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

type ParsedSegment = {
  type: "text" | "link";
  content: string;
  url?: string;
  displayText?: string;
};

export const parseTextWithLinks = (text: string): ParsedSegment[] => {
  const segments: ParsedSegment[] = [];
  const processedRanges: Array<[number, number]> = [];

  // First, find all markdown links
  let match: RegExpExecArray | null;
  const markdownMatches: Array<{
    start: number;
    end: number;
    displayText: string;
    url: string;
  }> = [];

  MARKDOWN_LINK_REGEX.lastIndex = 0;
  while ((match = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
    markdownMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      displayText: match[1],
      url: match[2],
    });
    processedRanges.push([match.index, match.index + match[0].length]);
  }

  // Find full URLs (not within markdown links)
  const urlMatches: Array<{ start: number; end: number; url: string }> = [];
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    const inMarkdown = processedRanges.some(
      ([start, end]) => match.index >= start && match.index < end
    );
    if (!inMarkdown) {
      urlMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        url: match[0],
      });
    }
  }

  // Find partial URLs (www.*) not within other matches
  const partialUrlMatches: Array<{ start: number; end: number; url: string }> =
    [];
  PARTIAL_URL_REGEX.lastIndex = 0;
  while ((match = PARTIAL_URL_REGEX.exec(text)) !== null) {
    const inOtherMatch =
      processedRanges.some(
        ([start, end]) => match.index >= start && match.index < end
      ) ||
      urlMatches.some((m) => match.index >= m.start && match.index < m.end);
    if (!inOtherMatch) {
      partialUrlMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        url: `https://${match[0]}`,
      });
    }
  }

  // Combine all matches and sort by position
  const allMatches = [
    ...markdownMatches.map((m) => ({ ...m, type: "markdown" as const })),
    ...urlMatches.map((m) => ({ ...m, type: "url" as const })),
    ...partialUrlMatches.map((m) => ({ ...m, type: "partial" as const })),
  ].sort((a, b) => a.start - b.start);

  // Build segments
  let lastIndex = 0;

  for (const match of allMatches) {
    // Add text before the match
    if (match.start > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.start),
      });
    }

    // Add the link
    if (match.type === "markdown") {
      segments.push({
        type: "link",
        content: match.displayText,
        displayText: match.displayText,
        url: match.url,
      });
    } else {
      segments.push({
        type: "link",
        content: match.url.replace("https://", ""),
        displayText: match.url.replace("https://", ""),
        url: match.url,
      });
    }

    lastIndex = match.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
};

interface LinkifiedTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({
  text,
  className = "",
  linkClassName = "text-blue-400 hover:text-blue-300 underline",
}) => {
  const segments = parseTextWithLinks(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <a
              key={index}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
              onClick={(e) => e.stopPropagation()}
            >
              {segment.displayText || segment.content}
            </a>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </span>
  );
};
