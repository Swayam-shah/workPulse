import { useEffect, useState, useMemo, useRef } from "react";
import mammoth from "mammoth/mammoth.browser";
import { init as initPptxPreview } from "pptx-preview";
import * as XLSX from "xlsx";
import { getTasks, createTask, updateTaskProgress, editTask, deleteTask } from "../services/taskService";
import { getTeams } from "../services/teamService";
import API from "../api/axios";
import Layout from "../components/Layout";
import TaskComments from "../components/TaskComments";
import { summarizeDocument } from "../services/aiService";

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.webm,.mov,.avi";
const CLOCK_VALUES = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTE_VALUES = Array.from({ length: 12 }, (_, index) => (index % 12) * 5);
const PREVIEW_FRAME_STYLES = `
  <style>
    :root {
      color-scheme: dark;
      font-family: Arial, sans-serif;
    }

    body {
      margin: 0;
      padding: 24px;
      background: #020617;
      color: #e2e8f0;
      line-height: 1.6;
    }

    body.sheet {
      padding: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(15, 23, 42, 0.95);
    }

    th,
    td {
      border: 1px solid #334155;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #0f172a;
      color: #f8fafc;
    }

    tr:nth-child(even) td {
      background: rgba(30, 41, 59, 0.75);
    }

    img {
      max-width: 100%;
      height: auto;
    }

    a {
      color: #38bdf8;
    }
  </style>
`;

function assigneeId(task) {
  const a = task.assignedTo;
  if (!a) return "";
  return String(a._id ?? a);
}

function parseTimeValue(value = "") {
  const [hoursRaw = "09", minutesRaw = "00"] = value.split(":");
  const parsedHours = Number.parseInt(hoursRaw, 10);
  const parsedMinutes = Number.parseInt(minutesRaw, 10);

  return {
    hours: Number.isNaN(parsedHours) ? 9 : parsedHours,
    minutes: Number.isNaN(parsedMinutes) ? 0 : parsedMinutes
  };
}

function padTime(value) {
  return String(value).padStart(2, "0");
}

function formatTimeValue(hours, minutes) {
  return `${padTime(hours)}:${padTime(minutes)}`;
}

function formatTimeLabel(value = "") {
  if (!value) return "Pick time";

  const { hours, minutes } = parseTimeValue(value);
  const displayHour = hours % 12 || 12;
  const meridiem = hours >= 12 ? "PM" : "AM";
  return `${displayHour}:${padTime(minutes)} ${meridiem}`;
}

function formatDateLabel(value = "") {
  if (!value) return "Pick date";

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return "Pick date";

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

function getCalendarGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    return cellDate;
  });
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftMonth(date, step) {
  return new Date(date.getFullYear(), date.getMonth() + step, 1);
}

function clockAngleFromPointer(event, element) {
  if (!element) return 0;

  const rect = element.getBoundingClientRect();
  const point = "touches" in event ? event.touches[0] : event;
  const x = point.clientX - (rect.left + rect.width / 2);
  const y = point.clientY - (rect.top + rect.height / 2);
  return (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;
}

function getDialAngle(value, mode) {
  if (mode === "hour") {
    return ((value % 12) * 30) % 360;
  }

  return ((value / 5) * 30) % 360;
}

function DateSelect({ name, value, onChange, className = "" }) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (!value) return new Date();
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedValue = value || "";
  const calendarDays = getCalendarGrid(viewDate);
  const todayValue = toDateInputValue(new Date());

  const emitChange = (nextValue) => {
    onChange({
      target: {
        name,
        value: nextValue
      }
    });
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => {
          const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
          if (!Number.isNaN(parsed.getTime())) {
            setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
          }
          setIsOpen((prev) => !prev);
        }}
        className="group flex min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-white shadow-inner shadow-black/20 transition hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 2V5M16 2V5M3 9H21M5 4H19C20.105 4 21 4.895 21 6V19C21 20.105 20.105 21 19 21H5C3.895 21 3 20.105 3 19V6C3 4.895 3.895 4 5 4Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Deadline</span>
            <span className="block text-sm font-medium">{formatDateLabel(value)}</span>
          </span>
        </span>
        <span className={`text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-full top-1/2 z-30 ml-4 w-[320px] max-w-[90vw] -translate-y-1/2 rounded-[28px] border border-slate-700 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Select date</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatDateLabel(value)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                emitChange(todayValue);
                setViewDate(new Date());
              }}
              className="rounded-full bg-orange-500/15 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/25"
            >
              Today
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate((prev) => shiftMonth(prev, -1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-sm font-semibold tracking-[0.16em] text-slate-200 uppercase">
              {formatMonthLabel(viewDate)}
            </p>
            <button
              type="button"
              onClick={() => setViewDate((prev) => shiftMonth(prev, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayValue = toDateInputValue(day);
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isSelected = dayValue === selectedValue;
              const isToday = dayValue === todayValue;

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => {
                    emitChange(dayValue);
                    setIsOpen(false);
                  }}
                  className={`flex h-10 items-center justify-center rounded-2xl text-sm font-medium transition ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                      : isCurrentMonth
                        ? "bg-slate-900 text-slate-200 hover:bg-slate-800"
                        : "bg-slate-950 text-slate-600 hover:bg-slate-900"
                  } ${isToday && !isSelected ? "ring-1 ring-orange-400/50" : ""}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSelect({ name, value, onChange, className = "" }) {
  const rootRef = useRef(null);
  const dialRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("hour");

  const { hours, minutes } = parseTimeValue(value);
  const isPm = hours >= 12;
  const activeHour = hours % 12 || 12;
  const activeMinute = Math.round(minutes / 5) * 5 % 60;
  const dialItems = mode === "hour"
    ? CLOCK_VALUES.map((hour) => ({ key: hour, label: hour, value: hour }))
    : MINUTE_VALUES.map((minute) => ({
        key: minute,
        label: padTime(minute),
        value: minute
      }));

  const emitChange = (nextHours, nextMinutes) => {
    onChange({
      target: {
        name,
        value: formatTimeValue(nextHours, nextMinutes)
      }
    });
  };

  const handleHourPick = (hour12) => {
    const nextHours = (hour12 % 12) + (isPm ? 12 : 0);
    emitChange(nextHours, activeMinute);
  };

  const handleMinutePick = (nextMinute) => {
    emitChange(hours, nextMinute);
  };

  const handleMeridiemPick = (nextMeridiem) => {
    const hour12 = hours % 12;
    emitChange(hour12 + (nextMeridiem === "PM" ? 12 : 0), activeMinute);
  };

  const updateFromPointer = (event) => {
    if (!dialRef.current) return;

    const angle = clockAngleFromPointer(event, dialRef.current);
    if (mode === "hour") {
      const selectedHour = Math.round(angle / 30) % 12 || 12;
      handleHourPick(selectedHour);
      return;
    }

    const selectedMinute = (Math.round(angle / 30) % 12) * 5;
    handleMinutePick(selectedMinute);
  };

  const startPointerSelection = (event) => {
    event.preventDefault();
    updateFromPointer(event);

    const move = (nextEvent) => updateFromPointer(nextEvent);
    const end = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  };

  const handAngle = getDialAngle(mode === "hour" ? activeHour : activeMinute, mode);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-white shadow-inner shadow-black/20 transition hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 6V12L16 14M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Deadline</span>
            <span className="block text-sm font-medium">{formatTimeLabel(value)}</span>
          </span>
        </span>
        <span className={`text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-full top-1/2 z-30 ml-4 w-[320px] max-w-[90vw] -translate-y-1/2 rounded-[28px] border border-slate-700 bg-slate-950/95 p-4 shadow-2xl shadow-black/40 backdrop-blur"
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Rotate to choose
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatTimeLabel(value)}</p>
              <p className="mt-1 text-xs text-slate-400">
                Drag the hand in either direction. Switch to minutes when you are ready.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("hour")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  mode === "hour" ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Hour
              </button>
              <button
                type="button"
                onClick={() => setMode("minute")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  mode === "minute" ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Minute
              </button>
            </div>
          </div>

          <div className="mb-4 flex gap-2 rounded-full bg-slate-900 p-1">
            {["AM", "PM"].map((meridiem) => (
              <button
                key={meridiem}
                type="button"
                onClick={() => handleMeridiemPick(meridiem)}
                className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${
                  (meridiem === "PM") === isPm
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-900/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {meridiem}
              </button>
            ))}
          </div>

          <div
            ref={dialRef}
            onMouseDown={startPointerSelection}
            onTouchStart={startPointerSelection}
            className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-orange-500/20 bg-[radial-gradient(circle_at_center,_rgba(251,146,60,0.18),_rgba(15,23,42,0.92)_58%,_rgba(2,6,23,1)_100%)] shadow-[inset_0_0_45px_rgba(15,23,42,0.9)] select-none"
          >
            <div className="pointer-events-none absolute inset-3 rounded-full border border-orange-500/10" />
            <div className="pointer-events-none absolute inset-8 rounded-full border border-slate-700/60" />
            <div className="pointer-events-none absolute inset-[52px] rounded-full border border-slate-800/70" />

            {Array.from({ length: 60 }, (_, index) => {
              const angle = index * 6;
              const isMajor = index % 5 === 0;
              return (
                <div
                  key={`tick-${angle}`}
                  className={`pointer-events-none absolute left-1/2 top-1/2 origin-bottom rounded-full ${
                    isMajor ? "h-3 w-[2px] bg-slate-500/70" : "h-2 w-px bg-slate-700/80"
                  }`}
                  style={{
                    transform: `translate(-50%, -100%) rotate(${angle}deg) translateY(-112px)`
                  }}
                />
              );
            })}

            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200"
              style={{ transform: `translate(-50%, -50%) rotate(${handAngle}deg)` }}
            >
              <div className="absolute left-1/2 top-2 h-14 w-1 -translate-x-1/2 rounded-full bg-gradient-to-t from-orange-500 via-orange-300 to-orange-100 shadow-[0_0_18px_rgba(251,146,60,0.45)]" />
              <div className="absolute bottom-3 left-1/2 h-8 w-[3px] -translate-x-1/2 rounded-full bg-orange-500/70" />
            </div>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/10"
            />
            <div className="pointer-events-none absolute h-4 w-4 rounded-full border-4 border-slate-950 bg-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.8)]" />

            {dialItems.map((item, index) => {
              const angle = mode === "hour" ? getDialAngle(item.value, mode) : index * 30;
              const radius = mode === "hour" ? 35 : 37;
              const left = 50 + Math.sin(angle * Math.PI / 180) * radius;
              const top = 50 - Math.cos(angle * Math.PI / 180) * radius;
              const isActive = mode === "hour" ? activeHour === item.value : activeMinute === item.value;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (mode === "hour") {
                      handleHourPick(item.value);
                    } else {
                      handleMinutePick(item.value);
                    }
                  }}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-semibold transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-900/40 scale-105"
                      : "bg-slate-900/85 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <span
                    className={`flex items-center justify-center rounded-full ${
                      mode === "hour" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
            >
              Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function officeSubtype(name = "") {
  if (/\.docx$/i.test(name)) return "docx";
  if (/\.(xls|xlsx|csv)$/i.test(name)) return "sheet";
  if (/\.pptx$/i.test(name)) return "pptx";
  if (/\.(doc|ppt)$/i.test(name)) return "legacy";
  return "unknown";
}

function buildPreviewFrame({ body, title, type = "document" }) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      ${PREVIEW_FRAME_STYLES}
    </head>
    <body class="${type}">
      ${body}
    </body>
  </html>`;
}

function buildSheetPreviewFrame(html, title) {
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head><title>${title}</title>${PREVIEW_FRAME_STYLES}`);
  }

  return buildPreviewFrame({ body: html, title, type: "sheet" });
}

function TaskCard({
  task,
  currentUserId,
  onProgressSave,
  failedVisual,
  canManageTask,
  onEditTask,
  onDeleteTask,
  onOpenAttachment
}) {

  const mine = assigneeId(task) === String(currentUserId);
  const isFailed = task.status === "failed" || failedVisual;
  const statusLabel = isFailed ? "failed" : task.status;
  const baseUrl = API.defaults.baseURL?.replace("/api", "") || "http://localhost:5000";

  return (
    <div
      className={`p-4 mb-3 rounded border transition ${
        isFailed
          ? "bg-red-950/50 border-red-600 border-2"
          : "bg-slate-900 border-slate-700 hover:shadow-lg"
      }`}
    >
      <p className="font-semibold text-white">{task.title}</p>
      <p className="text-sm text-slate-400">{task.description}</p>

      <div className="mt-2 space-y-1 text-xs text-slate-400">
        <p>
          <span className="text-slate-500">Team:</span>{" "}
          <span className="text-slate-200">{task.team?.name || "—"}</span>
        </p>
        <p>
          <span className="text-slate-500">Assigned by:</span>{" "}
          <span className="text-slate-200">{task.assignedBy?.name || "—"}</span>
        </p>
        <p>
          <span className="text-slate-500">Assignee:</span>{" "}
          <span className="text-slate-200">{task.assignedTo?.name || "Unassigned"}</span>
        </p>
        {task.deadline && (
          <p>
            <span className="text-slate-500">Deadline:</span>{" "}
            <span className="text-slate-200">
              {new Date(task.deadline).toLocaleString()}
            </span>
          </p>
        )}
      </div>

      {isFailed && (
        <p className="mt-2 text-sm font-semibold text-red-400">
          Task failed — not completed before the deadline ({task.percentage}% done)
        </p>
      )}

      <div className="mt-2">
        <p className="text-sm text-slate-500 mb-1">
          Progress:
          <span className="ml-2 text-sm text-orange-300 font-semibold">{task.percentage ?? 0}%</span>
          {mine && <span className="text-xs text-slate-500 ml-2">(only you can edit)</span>}
        </p>

        {mine ? (
          <input
            key={`${task._id}-${task.percentage}`}
            type="range"
            min={0}
            max={100}
            step={1}
            defaultValue={task.percentage ?? 0}
            className="w-full accent-orange-500"
            onMouseUp={(e) => onProgressSave(task, e.currentTarget.value)}
            onTouchEnd={(e) => onProgressSave(task, e.currentTarget.value)}
          />
        ) : (
          <div className="text-xs text-slate-400">
            {task.percentage ?? 0}%
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-1">
        Status: <span className="text-slate-300">{statusLabel}</span>
      </p>

      {(task.attachments || []).length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1">Attachments</p>
          <div className="space-y-1">
            {(task.attachments || []).map((a) => (
              <button
                key={a._id || a.fileName}
                type="button"
                onClick={() => onOpenAttachment(a, baseUrl)}
                className="block w-full text-left text-xs text-cyan-300 hover:text-cyan-100 truncate bg-slate-800/60 border border-slate-700 rounded px-2 py-1"
              >
                {a.originalName}
              </button>
            ))}
          </div>
        </div>
      )}

      {canManageTask && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onEditTask(task)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDeleteTask(task)}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
          >
            Delete
          </button>
        </div>
      )}

      <TaskComments taskId={task._id} />
    </div>
  );
}

export default function Tasks() {

  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const isAdmin = JSON.parse(localStorage.getItem("user") || "{}")?.role === "admin";

  const currentUserId = localStorage.getItem("userId");
  const canManageTask = (task) =>
    isAdmin || String(task?.assignedBy?._id || task?.assignedBy || "") === String(currentUserId);

  const [form, setForm] = useState({
    title: "",
    description: "",
    teamId: "",
    assignedTo: "",
    deadlineDate: "",
    deadlineTime: "",
    attachments: []
  });
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    teamId: "",
    assignedTo: "",
    deadlineDate: "",
    deadlineTime: "",
    attachments: [],
    removedAttachments: []
  });
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [officePreview, setOfficePreview] = useState({
    status: "idle",
    subtype: null,
    html: "",
    sheets: [],
    activeSheet: 0,
    error: ""
  });
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);

  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const pptxPreviewRef = useRef(null);
  const pptxInstanceRef = useRef(null);

  const teamMembers = useMemo(() => {
    const t = teams.find((x) => String(x._id) === String(form.teamId));
    return t?.members || [];
  }, [teams, form.teamId]);
  const editTeamMembers = useMemo(() => {
    const t = teams.find((x) => String(x._id) === String(editForm.teamId));
    return t?.members || [];
  }, [teams, editForm.teamId]);

  const [tick, setTick] = useState(() => Date.now());

  // Refresh tasks/teams periodically, and re-render frequently enough to reflect deadline passing.
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const [tasksData, teamsData] = await Promise.all([getTasks(), getTeams()]);
        if (!cancelled) {
          setTasks(tasksData);
          setTeams(teamsData);
        }
      } catch (err) {
        console.error("Failed to refresh tasks page data", err);
      }
    };

    refresh();
    const intervalId = setInterval(refresh, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => setTick(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const clearPptxPreview = () => {
      if (pptxInstanceRef.current?.destroy) {
        pptxInstanceRef.current.destroy();
      }
      pptxInstanceRef.current = null;
      if (pptxPreviewRef.current) {
        pptxPreviewRef.current.innerHTML = "";
      }
    };

    const resetOfficePreview = () => {
      setOfficePreview({
        status: "idle",
        subtype: null,
        html: "",
        sheets: [],
        activeSheet: 0,
        error: ""
      });
    };

    if (!attachmentPreview || previewKind(attachmentPreview.name) !== "office") {
      clearPptxPreview();
      resetOfficePreview();
      return () => {
        clearPptxPreview();
      };
    }

    const loadOfficePreview = async () => {
      const subtype = officeSubtype(attachmentPreview.name);

      setOfficePreview({
        status: "loading",
        subtype,
        html: "",
        sheets: [],
        activeSheet: 0,
        error: ""
      });

      try {
        const response = await fetch(attachmentPreview.url);
        if (!response.ok) {
          throw new Error("Could not load attachment preview");
        }

        const data = await response.arrayBuffer();
        if (cancelled) return;

        if (subtype === "docx") {
          const result = await mammoth.convertToHtml({ arrayBuffer: data });
          if (cancelled) return;

          setOfficePreview({
            status: "ready",
            subtype,
            html: buildPreviewFrame({
              body: result.value || "<p>No preview available.</p>",
              title: attachmentPreview.name
            }),
            sheets: [],
            activeSheet: 0,
            error: ""
          });
          return;
        }

        if (subtype === "sheet") {
          const workbook = XLSX.read(data, { type: "array" });
          const sheets = workbook.SheetNames.map((sheetName) => ({
            name: sheetName,
            html: buildSheetPreviewFrame(
              XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]),
              `${attachmentPreview.name} - ${sheetName}`
            )
          }));

          if (cancelled) return;

          setOfficePreview({
            status: "ready",
            subtype,
            html: "",
            sheets,
            activeSheet: 0,
            error: ""
          });
          return;
        }

        if (subtype === "pptx") {
          clearPptxPreview();

          if (!pptxPreviewRef.current) {
            throw new Error("PowerPoint preview container is not ready");
          }

          const viewer = initPptxPreview(pptxPreviewRef.current, {
            width: Math.max(pptxPreviewRef.current.clientWidth - 8, 720),
            height: 640,
            mode: "slide"
          });

          pptxInstanceRef.current = viewer;
          // pptx-preview requires Uint8Array, not raw ArrayBuffer
          await viewer.preview(new Uint8Array(data));
          if (cancelled) return;

          setOfficePreview({
            status: "ready",
            subtype,
            html: "",
            sheets: [],
            activeSheet: 0,
            error: ""
          });
          return;
        }

        throw new Error("This older Office format cannot be rendered locally yet.");
      } catch (error) {
        if (cancelled) return;

        clearPptxPreview();
        setOfficePreview({
          status: "error",
          subtype,
          html: "",
          sheets: [],
          activeSheet: 0,
          error: error.message || "Could not render this file in the popup."
        });
      }
    };

    loadOfficePreview();

    return () => {
      cancelled = true;
      clearPptxPreview();
    };
  }, [attachmentPreview]);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleTeamChange = (e) => {
    const teamId = e.target.value;
    setForm((prev) => ({
      ...prev,
      teamId,
      assignedTo: ""
    }));
  };

  const handleCreateAttachmentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      alert(`"${oversized.name}" exceeds 100MB limit.`);
      e.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files].slice(0, MAX_FILES)
    }));
    if ((form.attachments?.length || 0) + files.length > MAX_FILES) {
      alert("Maximum 10 files allowed.");
    }
    e.target.value = "";
  };

  const removeCreateAttachment = (index) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async () => {

    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    if (!form.teamId || !form.assignedTo) {
      alert("Select a team and assignee from that team");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      team: form.teamId,
      assignedTo: form.assignedTo,
      deadline:
        form.deadlineDate && form.deadlineTime
          ? new Date(`${form.deadlineDate}T${form.deadlineTime}:00`).toISOString()
          : undefined,
      attachments: form.attachments || []
    };

    await createTask(payload);

    setForm({
      title: "",
      description: "",
      teamId: "",
      assignedTo: "",
      deadlineDate: "",
      deadlineTime: "",
      attachments: []
    });

    loadTasks();
  };

  const handleProgressSave = async (task, raw) => {
    const v = Number(raw);
    if (Number.isNaN(v) || v < 0 || v > 100) {
      alert("Percentage must be between 0 and 100");
      loadTasks();
      return;
    }
    if (v === task.percentage) return;

    try {
      await updateTaskProgress(task._id, v);
      loadTasks();
    } catch (err) {
      console.error(err);
      alert(err.response?.data || err.message || "Could not update progress");
      loadTasks();
    }
  };

  const openDeleteModal = (task) => {
    setDeleteError("");
    setDeletingTask(task);
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      setIsDeletingTask(true);
      setDeleteError("");
      await deleteTask(deletingTask._id);
      setDeletingTask(null);
      loadTasks();
    } catch (err) {
      setDeleteError(err.response?.data || err.message || "Could not delete task");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const openEditModal = (task) => {
    const d = task.deadline ? new Date(task.deadline) : null;
    const dd = d ? d.toISOString().slice(0, 10) : "";
    const dt = d ? d.toISOString().slice(11, 16) : "";

    setEditError("");
    setEditingTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      teamId: task.team?._id || task.team || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      deadlineDate: dd,
      deadlineTime: dt,
      attachments: [],
      removedAttachments: []
    });
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEditTeamChange = (e) => {
    const teamId = e.target.value;
    setEditForm((prev) => ({
      ...prev,
      teamId,
      assignedTo: ""
    }));
  };

  const handleEditAttachmentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized) {
      alert(`"${oversized.name}" exceeds 100MB limit.`);
      e.target.value = "";
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...files].slice(0, MAX_FILES)
    }));
    if ((editForm.attachments?.length || 0) + files.length > MAX_FILES) {
      alert("Maximum 10 files allowed.");
    }
    e.target.value = "";
  };

  const removeNewEditAttachment = (index) => {
    setEditForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const markExistingAttachmentForRemoval = (attachmentId) => {
    setEditForm((prev) => ({
      ...prev,
      removedAttachments: [...(prev.removedAttachments || []), String(attachmentId)]
    }));
  };

  const unmarkExistingAttachmentForRemoval = (attachmentId) => {
    setEditForm((prev) => ({
      ...prev,
      removedAttachments: (prev.removedAttachments || []).filter((id) => id !== String(attachmentId))
    }));
  };

  const handleEditSubmit = async () => {
    if (!editingTask) return;
    if (!editForm.title.trim()) {
      setEditError("Title is required");
      return;
    }
    if (!editForm.teamId || !editForm.assignedTo) {
      setEditError("Select a team and assignee");
      return;
    }

    setEditError("");
    const payload = {
      title: editForm.title,
      description: editForm.description,
      team: editForm.teamId,
      assignedTo: editForm.assignedTo,
      attachments: editForm.attachments || [],
      removedAttachments: editForm.removedAttachments || []
    };

    if (editForm.deadlineDate && editForm.deadlineTime) {
      payload.deadline = new Date(`${editForm.deadlineDate}T${editForm.deadlineTime}:00`).toISOString();
    } else {
      payload.deadline = null;
    }

    try {
      setIsSavingEdit(true);
      await editTask(editingTask._id, payload);
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      setEditError(err.response?.data || err.message || "Could not edit task");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredTasks =
    filter === "mine"
      ? tasks
          .filter((task) => assigneeId(task) === String(currentUserId))
          .filter((task) =>
            teamFilter === "all"
              ? true
              : String(task.team?._id || task.team || "") === String(teamFilter)
          )
      : tasks.filter((task) =>
          teamFilter === "all"
            ? true
            : String(task.team?._id || task.team || "") === String(teamFilter)
        );

  const now = new Date(tick);

  const isPastDeadlineIncomplete = (task) => {
    if (!task.deadline) return false;
    if ((task.percentage ?? 0) >= 100) return false;
    return new Date(task.deadline) < now;
  };

  const effectiveStatus = (task) =>
    isPastDeadlineIncomplete(task) ? "failed" : task.status;

  const byStatus = (status) =>
    filteredTasks.filter((t) => effectiveStatus(t) === status);

  const openAttachmentPreview = (attachment, baseUrl) => {
    const absoluteUrl = new URL(`${baseUrl}${attachment.url}`, window.location.origin).toString();

    setAttachmentPreview({
      name: attachment.originalName,
      url: absoluteUrl,
      originalUrl: attachment.url
    });
  };

  const closeAttachmentPreview = () => {
    setAttachmentPreview(null);
    setAiSummary(null);
    setIsAiSummarizing(false);
  };

  const openPreviewInNewTab = () => {
    if (!attachmentPreview) return;
    window.open(attachmentPreview.url, "_blank", "noopener,noreferrer");
  };

  const previewKind = (name = "") => {
    if (/\.(mp4|webm|mov|avi)$/i.test(name)) return "video";
    if (/\.(mp3)$/i.test(name)) return "audio";
    if (/\.(pdf)$/i.test(name)) return "pdf";
    if (/\.(doc|docx|ppt|pptx|xls|xlsx|csv)$/i.test(name)) return "office";
    return "file";
  };

  // Extensions the AI summarize backend supports
  const canAiSummarize = (name = "") =>
    /\.(pdf|xlsx|xls|csv|docx|pptx|png|jpg|jpeg|gif|webp|txt)$/i.test(name);

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Tasks
      </h1>

      <div className="flex gap-3 mb-6">

        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-1 rounded ${
            filter === "all" ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"
          }`}
        >
          All Tasks
        </button>

        <button
          type="button"
          onClick={() => setFilter("mine")}
          className={`px-4 py-1 rounded ${
            filter === "mine" ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"
          }`}
        >
          My Tasks
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Team</span>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-sm px-2 py-1 rounded"
          >
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </select>
        </div>

      </div>

      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg mb-8">

        <h2 className="font-semibold mb-4 text-white">
          Create Task
        </h2>

        <p className="text-sm text-slate-400 mb-3">
          You can only assign people who are members of the selected team. Join teams from the Teams page.
        </p>

        <div className="flex flex-col gap-3 max-w-4xl">

          <div className="flex gap-3 flex-wrap">
            <input
              name="title"
              placeholder="Title"
              onChange={handleChange}
              value={form.title}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white min-w-[160px]"
            />

            <input
              name="description"
              placeholder="Description"
              onChange={handleChange}
              value={form.description}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white flex-1 min-w-[200px]"
            />
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <select
              name="teamId"
              onChange={handleTeamChange}
              value={form.teamId}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>

            <select
              name="assignedTo"
              onChange={handleChange}
              value={form.assignedTo}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white disabled:opacity-50"
              disabled={!form.teamId}
            >
              <option value="">Assign team member</option>
              {teamMembers.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <label className="flex items-center gap-3 text-slate-300 text-sm">
              <span className="shrink-0">Date</span>
              <DateSelect
                name="deadlineDate"
                onChange={handleChange}
                value={form.deadlineDate}
                className="min-w-[240px]"
              />
            </label>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <label className="flex items-center gap-3 text-slate-300 text-sm">
              <span className="shrink-0">Time</span>
              <TimeSelect
                name="deadlineTime"
                onChange={handleChange}
                value={form.deadlineTime}
                className="min-w-[240px]"
              />
            </label>

            <input
              ref={createFileInputRef}
              type="file"
              multiple
              accept={FILE_ACCEPT}
              onChange={handleCreateAttachmentsChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => createFileInputRef.current?.click()}
              className="group flex min-w-[240px] items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-white shadow-inner shadow-black/20 transition hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M21.44 11.05L12.25 20.24C10.19 22.3 6.85 22.3 4.79 20.24C2.73 18.18 2.73 14.84 4.79 12.78L13.98 3.59C15.35 2.22 17.57 2.22 18.94 3.59C20.31 4.96 20.31 7.18 18.94 8.55L9.74 17.75C9.06 18.43 7.95 18.43 7.27 17.75C6.59 17.07 6.59 15.96 7.27 15.28L15.75 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Attachments</span>
                  <span className="block text-sm font-medium">Attach files</span>
                </span>
              </span>
              <span className="text-xs text-slate-400">10 max</span>
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
            >
              Create
            </button>
          </div>

          {(form.attachments || []).length > 0 && (
            <div className="text-xs text-slate-300">
              <p className="mb-1">Files to upload:</p>
              <div className="flex flex-wrap gap-2">
                {form.attachments.map((file, idx) => (
                  <button
                    key={`${file.name}-${idx}`}
                    type="button"
                    onClick={() => removeCreateAttachment(idx)}
                    className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
                  >
                    {file.name} x
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl shadow">
          <h2 className="font-bold mb-4 text-white">Todo</h2>
          {byStatus("todo").map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={currentUserId}
              onProgressSave={handleProgressSave}
              failedVisual={isPastDeadlineIncomplete(task)}
              canManageTask={canManageTask(task)}
              onEditTask={openEditModal}
              onDeleteTask={openDeleteModal}
              onOpenAttachment={openAttachmentPreview}
            />
          ))}
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl shadow">
          <h2 className="font-bold mb-4 text-white">In progress</h2>
          {byStatus("in-progress").map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={currentUserId}
              onProgressSave={handleProgressSave}
              failedVisual={isPastDeadlineIncomplete(task)}
              canManageTask={canManageTask(task)}
              onEditTask={openEditModal}
              onDeleteTask={openDeleteModal}
              onOpenAttachment={openAttachmentPreview}
            />
          ))}
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl shadow">
          <h2 className="font-bold mb-4 text-white">Completed</h2>
          {byStatus("completed").map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={currentUserId}
              onProgressSave={handleProgressSave}
              failedVisual={isPastDeadlineIncomplete(task)}
              canManageTask={canManageTask(task)}
              onEditTask={openEditModal}
              onDeleteTask={openDeleteModal}
              onOpenAttachment={openAttachmentPreview}
            />
          ))}
        </div>

        <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl shadow">
          <h2 className="font-bold mb-4 text-red-400">Failed</h2>
          {byStatus("failed").map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              currentUserId={currentUserId}
              onProgressSave={handleProgressSave}
              failedVisual={isPastDeadlineIncomplete(task)}
              canManageTask={canManageTask(task)}
              onEditTask={openEditModal}
              onDeleteTask={openDeleteModal}
              onOpenAttachment={openAttachmentPreview}
            />
          ))}
        </div>

      </div>

      {attachmentPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-700">
              <p className="text-white text-sm truncate">{attachmentPreview.name}</p>
              <div className="flex gap-2">
                {canAiSummarize(attachmentPreview.name) && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                       setIsAiSummarizing(true);
                       setAiSummary(null);
                       const res = await fetch(attachmentPreview.url);
                       if (!res.ok) throw new Error("Could not fetch the file for summarization");
                       const blob = await res.blob();
                       const summary = await summarizeDocument(blob, attachmentPreview.name);
                       setAiSummary(summary);
                    } catch (e) {
                       const msg = e.response?.data?.error || e.response?.data?.details || e.message || "Unknown error";
                       alert("AI Summarize failed: " + msg);
                    } finally {
                       setIsAiSummarizing(false);
                    }
                  }}
                  disabled={isAiSummarizing}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1 rounded disabled:opacity-50 flex items-center gap-1 font-medium transition"
                >
                  {isAiSummarizing ? (
                    <span className="flex items-center gap-1">⏳ Summarizing...</span>
                  ) : (
                    <span className="flex items-center gap-1">✨ AI Summarize</span>
                  )}
                </button>
                )}
                <button
                  type="button"
                  onClick={openPreviewInNewTab}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1 rounded"
                >
                  Open in new tab
                </button>
                <button
                  type="button"
                  onClick={closeAttachmentPreview}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950/80 p-4 overflow-hidden overflow-y-auto">
              
              {aiSummary && (
                <div className="mb-4 bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                  <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                    ✨ AI Interpretation & Summary
                  </h3>
                  <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {aiSummary}
                  </div>
                </div>
              )}

              {previewKind(attachmentPreview.name) === "video" ? (
                <video
                  src={attachmentPreview.url}
                  controls
                  className="w-full h-[70vh] bg-black rounded"
                />
              ) : previewKind(attachmentPreview.name) === "audio" ? (
                <div className="h-[70vh] rounded border border-slate-800 bg-slate-950 flex items-center justify-center">
                  <audio
                    src={attachmentPreview.url}
                    controls
                    className="w-full max-w-xl"
                  />
                </div>
              ) : previewKind(attachmentPreview.name) === "office" ? (
                <div className="w-full h-[70vh] rounded overflow-hidden border border-slate-800 bg-slate-950">
                  {officePreview.status === "loading" && (
                    <div className="h-full flex items-center justify-center text-slate-300">
                      Loading local preview...
                    </div>
                  )}

                  {officePreview.status === "error" && (
                    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                      <p className="text-lg font-semibold text-white">Could not render this file locally</p>
                      <p className="mt-2 max-w-lg text-sm text-slate-400">
                        {officePreview.error}
                      </p>
                      <button
                        type="button"
                        onClick={openPreviewInNewTab}
                        className="mt-5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                      >
                        Open file in new tab
                      </button>
                    </div>
                  )}

                  {officePreview.status === "ready" && officePreview.subtype === "docx" && (
                    <iframe
                      srcDoc={officePreview.html}
                      title={attachmentPreview.name}
                      sandbox=""
                      className="w-full h-full bg-slate-900"
                    />
                  )}

                  {officePreview.status === "ready" && officePreview.subtype === "sheet" && (
                    <div className="h-full flex flex-col">
                      <div className="flex gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-2 overflow-x-auto">
                        {officePreview.sheets.map((sheet, index) => (
                          <button
                            key={sheet.name}
                            type="button"
                            onClick={() =>
                              setOfficePreview((prev) => ({
                                ...prev,
                                activeSheet: index
                              }))
                            }
                            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                              officePreview.activeSheet === index
                                ? "bg-orange-500 text-white"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {sheet.name}
                          </button>
                        ))}
                      </div>
                      <iframe
                        srcDoc={officePreview.sheets[officePreview.activeSheet]?.html || ""}
                        title={`${attachmentPreview.name} sheet preview`}
                        sandbox=""
                        className="w-full flex-1 bg-slate-900"
                      />
                    </div>
                  )}

                  {officePreview.subtype === "pptx" && (
                    <div
                      ref={pptxPreviewRef}
                      className={`h-full overflow-auto bg-slate-950 ${officePreview.status === "ready" ? "block" : "hidden"}`}
                    />
                  )}
                </div>
              ) : (
                <iframe
                  src={attachmentPreview.url}
                  title={attachmentPreview.name}
                  className="w-full h-[70vh] bg-slate-900 rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Task</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                placeholder="Title"
                className="bg-slate-800 border border-slate-700 p-2 rounded text-white"
              />
              <input
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                className="bg-slate-800 border border-slate-700 p-2 rounded text-white"
              />
              <select
                name="teamId"
                value={editForm.teamId}
                onChange={handleEditTeamChange}
                className="bg-slate-800 border border-slate-700 p-2 rounded text-white"
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
              <select
                name="assignedTo"
                value={editForm.assignedTo}
                onChange={handleEditChange}
                className="bg-slate-800 border border-slate-700 p-2 rounded text-white"
                disabled={!editForm.teamId}
              >
                <option value="">Assign team member</option>
                {editTeamMembers.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-3 text-slate-300 text-sm md:col-span-2">
                <span className="shrink-0">Date</span>
                <DateSelect
                  name="deadlineDate"
                  value={editForm.deadlineDate}
                  onChange={handleEditChange}
                  className="min-w-0 flex-1"
                />
              </label>
              <label className="flex items-center gap-3 text-slate-300 text-sm md:col-span-2">
                <span className="shrink-0">Time</span>
                <TimeSelect
                  name="deadlineTime"
                  value={editForm.deadlineTime}
                  onChange={handleEditChange}
                  className="min-w-0 flex-1"
                />
              </label>
              <input
                ref={editFileInputRef}
                type="file"
                multiple
                accept={FILE_ACCEPT}
                onChange={handleEditAttachmentsChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => editFileInputRef.current?.click()}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-white shadow-inner shadow-black/20 transition hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/60 md:col-span-2"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M21.44 11.05L12.25 20.24C10.19 22.3 6.85 22.3 4.79 20.24C2.73 18.18 2.73 14.84 4.79 12.78L13.98 3.59C15.35 2.22 17.57 2.22 18.94 3.59C20.31 4.96 20.31 7.18 18.94 8.55L9.74 17.75C9.06 18.43 7.95 18.43 7.27 17.75C6.59 17.07 6.59 15.96 7.27 15.28L15.75 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Attachments</span>
                    <span className="block text-sm font-medium">Add or replace files</span>
                  </span>
                </span>
                <span className="text-xs text-slate-400">10 max</span>
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-300">Existing attachments</p>
              {(editingTask.attachments || []).length === 0 && (
                <p className="text-xs text-slate-500">No existing attachments</p>
              )}
              {(editingTask.attachments || []).map((a) => {
                const removing = (editForm.removedAttachments || []).includes(String(a._id));
                return (
                  <div key={a._id || a.fileName} className="flex items-center justify-between text-xs">
                    <span className={`truncate ${removing ? "line-through text-slate-500" : "text-slate-300"}`}>
                      {a.originalName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removing
                          ? unmarkExistingAttachmentForRemoval(a._id)
                          : markExistingAttachmentForRemoval(a._id)
                      }
                      className="ml-2 bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white"
                    >
                      {removing ? "Undo" : "Remove"}
                    </button>
                  </div>
                );
              })}

              {(editForm.attachments || []).length > 0 && (
                <>
                  <p className="text-sm text-slate-300 mt-2">New files to add</p>
                  <div className="flex flex-wrap gap-2">
                    {editForm.attachments.map((file, idx) => (
                      <button
                        key={`${file.name}-${idx}`}
                        type="button"
                        onClick={() => removeNewEditAttachment(idx)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white"
                      >
                        {file.name} x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {editError && (
              <p className="text-red-400 text-sm mt-3">{editError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                disabled={isSavingEdit}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-4 py-2 rounded"
              >
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white">Delete Task</h3>
            <p className="text-slate-300 mt-2">
              Are you sure you want to delete <span className="font-semibold">{deletingTask.title}</span>?
            </p>
            <p className="text-slate-500 text-sm mt-1">This action cannot be undone.</p>

            {deleteError && (
              <p className="text-red-400 text-sm mt-3">{deleteError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTask(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={isDeletingTask}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded"
              >
                {isDeletingTask ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
