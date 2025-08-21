import React from "react";
import { parseTextWithLinks } from "./linkParserUtils";

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
