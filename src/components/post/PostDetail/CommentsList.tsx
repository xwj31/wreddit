import { useState } from "react";
import { ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { formatTimeAgo, formatScore } from "../../../utils";
import { Button } from "../../ui/Button";
import type { RedditComment } from "../../../types";

type CommentsListProps = {
  comments: RedditComment[];
  loading: boolean;
};

type CommentProps = {
  comment: RedditComment;
  depth: number;
};

// Define colors for different comment depths
const getCommentLineColor = (depth: number): string => {
  const colors = [
    "border-blue-500", // Top-level comments - bright blue
    "border-green-500", // 1st level replies - green
    "border-yellow-500", // 2nd level replies - yellow
    "border-purple-500", // 3rd level replies - purple
    "border-pink-500", // 4th level replies - pink
    "border-orange-500", // 5th level replies - orange
    "border-red-500", // 6th level replies - red
    "border-cyan-500", // 7th level replies - cyan
  ];

  // For very deep nesting, cycle through colors
  return colors[depth % colors.length];
};

const Comment = ({ comment, depth }: CommentProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasReplies = comment.replies && typeof comment.replies !== "string";

  const childComments =
    hasReplies && comment.replies
      ? comment.replies.data.children
          .filter((child) => child.kind === "t1")
          .map((child) => child.data as RedditComment)
      : [];

  const toggleExpanded = () => setExpanded(!expanded);

  const lineColor = getCommentLineColor(depth);
  const lineWidth = depth === 0 ? "border-l-3" : "border-l-2";

  return (
    <div className={`${lineColor} ${lineWidth} pl-3 mb-3 relative`}>
      {/* Add a subtle background tint for better visual separation */}
      <div
        className={`${depth > 0 ? "bg-gray-900/20 rounded-r-lg" : ""} p-1 -m-1`}
      >
        <div className="flex items-start gap-2 mb-2">
          <div className="flex flex-col items-center mt-1">
            <ArrowUp size={14} className="text-gray-500" />
            <span className="text-xs text-gray-400">
              {formatScore(comment.score)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-300">
                u/{comment.author}
              </span>
              <span className="text-gray-500 text-xs">
                {formatTimeAgo(comment.created_utc)}
              </span>
              {/* Add depth indicator for very nested comments */}
              {depth > 2 && (
                <span className="text-xs text-gray-600 bg-gray-800 px-1 rounded">
                  depth {depth}
                </span>
              )}
            </div>

            {expanded && (
              <div className="text-sm text-gray-200 mt-1 whitespace-pre-line">
                {comment.body}
              </div>
            )}

            {hasReplies && (
              <Button
                onClick={toggleExpanded}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 mt-1 p-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} />
                    <span>Hide {childComments.length} replies</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    <span>Show {childComments.length} replies</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {expanded && hasReplies && (
          <div className="ml-1">
            {childComments.map((childComment) => (
              <Comment
                key={childComment.id}
                comment={childComment}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentsList = ({ comments, loading }: CommentsListProps) => {
  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">Loading comments...</div>
    );
  }

  if (comments.length === 0) {
    return <div className="p-4 text-center text-gray-400">No comments yet</div>;
  }

  return (
    <div className="p-4">
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} depth={0} />
      ))}
    </div>
  );
};
