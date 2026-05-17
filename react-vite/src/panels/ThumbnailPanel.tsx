import { useState } from "react";
import {
  extractThumbnail,
  type ThumbnailQuality,
} from "@mdslabs/wc-media-compressor-sdk";
import { formatBytes } from "../utils";

export function ThumbnailPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<ThumbnailQuality>("balanced");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    url: string;
    size: number;
    timestampSeconds: number;
  } | null>(null);

  async function onExtract() {
    if (!file) return;
    setBusy(true);
    setError(null);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const { blob, timestampSeconds } = await extractThumbnail(file, quality);
      setResult({ url: URL.createObjectURL(blob), size: blob.size, timestampSeconds });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Extract best-frame thumbnail</h2>

      <input
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        disabled={busy}
      />

      {file && (
        <p className="meta">
          {file.name} — {formatBytes(file.size)}
        </p>
      )}

      <div className="controls">
        <label>
          Quality preset
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as ThumbnailQuality)}
            disabled={busy}
          >
            <option value="performance">performance (fast)</option>
            <option value="balanced">balanced (default)</option>
            <option value="quality">quality</option>
            <option value="best-quality">best-quality</option>
          </select>
        </label>
      </div>

      <button onClick={onExtract} disabled={!file || busy}>
        {busy ? "Analyzing frames…" : "Extract"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <p>
            Best frame at {result.timestampSeconds.toFixed(2)}s — {formatBytes(result.size)} JPEG
          </p>
          <img src={result.url} alt="thumbnail" />
          <a href={result.url} download="thumbnail.jpg">
            Download JPEG
          </a>
        </div>
      )}
    </section>
  );
}
