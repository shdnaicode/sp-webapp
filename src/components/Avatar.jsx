import React, { useMemo, useState } from "react";
import { apiUrl } from "../lib/api";

export default function Avatar({ user, size = 40, className = "" }) {
  const username = String(user?.username || "U");
  const initials = username.trim().slice(0, 1).toUpperCase();
  const numericSize = typeof size === "number" ? size : parseInt(size, 10) || 40;
  const dim = typeof size === "number" ? `${size}px` : size;
  const fontPx = Math.max(12, Math.round(numericSize * 0.5));

  const srcRaw = user?.profileImage;
  const resolvedSrc = useMemo(() => {
    if (!srcRaw) return null;
    if (/^https?:\/\//i.test(srcRaw)) return srcRaw;
    return apiUrl(srcRaw);
  }, [srcRaw]);

  const [errored, setErrored] = useState(false);
  const showImage = resolvedSrc && !errored;

  return (
    <div
      className={`rounded-full border-2 overflow-hidden flex items-center justify-center bg-gray-100 ${className}`}
      style={{ width: dim, height: dim }}
      aria-label={username}
    >
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={username}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="font-semibold text-gray-700 leading-none" style={{ fontSize: `${fontPx}px` }}>
          {initials}
        </span>
      )}
    </div>
  );
}
