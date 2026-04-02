import { useEffect, useState } from "react";
import API from "../api/axios";

function TaskComments({ taskId }) {

  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await API.get(`/comments/${taskId}`);
        if (!cancelled) {
          setComments(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch comments", err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [taskId, reloadKey]);

  const addComment = async () => {

    if (!text.trim()) return;

    try {

      await API.post(`/comments/${taskId}`, { text });

      setText("");
      setReloadKey((k) => k + 1);

    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-700 pt-2">

      <h4 className="text-sm font-semibold text-slate-300 mb-1">
        Comments
      </h4>

      <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
        {comments.map((c) => (
          <p key={c._id} className="text-sm text-slate-200">
            <span className="text-orange-400 font-semibold">
              {c.user?.name}
            </span>
            : {c.text}
          </p>
        ))}
      </div>

      <div className="flex gap-2">

        <input
          type="text"
          placeholder="Write comment..."
          className="bg-slate-800 text-white placeholder-slate-400 p-1 text-xs rounded w-full border border-slate-700 focus:outline-none"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
        />

        <button
          type="button"
          onClick={addComment}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 rounded"
        >
          Send
        </button>

      </div>

    </div>
  );
}

export default TaskComments;
