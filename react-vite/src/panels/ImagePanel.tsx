import { useState } from "react";
import {
  compressImage,
  type CompressedImageOutput,
  type ImageCompressionPreset,
  type ImageOutputFormat,
} from "@mdslabs/wc-media-compressor-sdk";
import { formatBytes } from "../utils";

const ALL_FORMATS: ImageOutputFormat[] = ["jpeg", "webp", "png"];
const PRESETS: ImageCompressionPreset[] = ["lossless", "high", "balanced", "small", "tiny"];

// Same buckets the SDK uses to map a continuous quality value to a preset.
// Kept inline here so the UI label can stay in sync with what's actually applied.
function qualityToPreset(q: number): ImageCompressionPreset {
  if (q >= 0.95) return "lossless";
  if (q >= 0.85) return "high";
  if (q >= 0.7) return "balanced";
  if (q >= 0.5) return "small";
  return "tiny";
}

const PRESET_QUALITY: Record<ImageCompressionPreset, number> = {
  lossless: 1.0,
  high: 0.9,
  balanced: 0.8,
  small: 0.6,
  tiny: 0.4,
};

export function ImagePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [formats, setFormats] = useState<ImageOutputFormat[]>(["jpeg", "webp"]);
  const [quality, setQuality] = useState(0.8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    urls: Record<string, string>;
    out: CompressedImageOutput;
  } | null>(null);

  const activePreset = qualityToPreset(quality);

  function toggleFormat(f: ImageOutputFormat) {
    setFormats((curr) => (curr.includes(f) ? curr.filter((x) => x !== f) : [...curr, f]));
  }

  function applyPreset(p: ImageCompressionPreset) {
    setQuality(PRESET_QUALITY[p]);
  }

  async function onCompress() {
    if (!file || formats.length === 0) return;
    setBusy(true);
    setError(null);

    if (result) {
      for (const url of Object.values(result.urls)) URL.revokeObjectURL(url);
    }
    setResult(null);

    try {
      const out = await compressImage(file, { outputFormats: formats, quality });
      const urls: Record<string, string> = {};
      for (const [fmt, f] of Object.entries(out)) {
        urls[fmt] = URL.createObjectURL(f);
      }
      setResult({ urls, out });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Compress image</h2>

      <input
        type="file"
        accept="image/*,.heic,.heif"
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
          Output formats
          <span className="checks">
            {ALL_FORMATS.map((f) => (
              <label key={f} className="check">
                <input
                  type="checkbox"
                  checked={formats.includes(f)}
                  onChange={() => toggleFormat(f)}
                  disabled={busy}
                />
                {f}
              </label>
            ))}
          </span>
        </label>

        <label>
          Quality ({quality.toFixed(2)}) — preset: <strong>{activePreset}</strong>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            disabled={busy}
          />
          <span className="preset-row">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={p === activePreset ? "preset active" : "preset"}
                onClick={() => applyPreset(p)}
                disabled={busy}
              >
                {p}
              </button>
            ))}
          </span>
        </label>

      </div>

      <button onClick={onCompress} disabled={!file || busy || formats.length === 0}>
        {busy ? "Compressing…" : "Compress"}
      </button>

      {error && <p className="error">{error}</p>}

      {result && file && (
        <div className="result">
          {Object.entries(result.out).map(([fmt, f]) => {
            const ratio = (1 - f.size / file.size) * 100;
            return (
              <div key={fmt} className="image-result">
                <p>
                  <strong>{fmt.toUpperCase()}</strong> — {formatBytes(file.size)} →{" "}
                  {formatBytes(f.size)} ({ratio.toFixed(1)}% smaller)
                </p>
                <img src={result.urls[fmt]} alt={`${fmt} output`} />
                <a href={result.urls[fmt]} download={f.name}>
                  Download {f.name}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
