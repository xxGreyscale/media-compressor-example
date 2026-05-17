import { useEffect, useState } from "react";
import {
  compressVideo,
  probeVideo,
  type VideoCompressionResult,
  type VideoMetadata,
} from "@mdslabs/wc-media-compressor-sdk";
import { formatBytes } from "../utils";

type Phase = "decode" | "encode" | "mux" | null;

// Standard ladder values — the panel filters these against the source's
// metadata so users can't pick anything above the input.
const BITRATE_LADDER = [500_000, 1_000_000, 2_000_000, 4_000_000, 8_000_000, 16_000_000];
const WIDTH_LADDER = [480, 720, 854, 1280, 1920, 2560, 3840];
const FPS_LADDER = [24, 30, 60];

function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(bps % 1_000_000 ? 1 : 0)} Mbps`;
  return `${Math.round(bps / 1000)} kbps`;
}

export function VideoPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [probing, setProbing] = useState(false);
  const [probeError, setProbeError] = useState<string | null>(null);

  const [bitrate, setBitrate] = useState(2_000_000);
  const [maxWidth, setMaxWidth] = useState<number | "original">("original");
  const [maxFps, setMaxFps] = useState<number | "original">(24);

  const [phase, setPhase] = useState<Phase>(null);
  const [percent, setPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    info: VideoCompressionResult;
  } | null>(null);

  // Probe the source as soon as a file is selected. Constrains the bitrate /
  // resolution / fps choices to values the SDK can actually deliver.
  useEffect(() => {
    if (!file) {
      setMeta(null);
      setProbeError(null);
      return;
    }
    let cancelled = false;
    setProbing(true);
    setProbeError(null);
    probeVideo(file)
      .then((m) => {
        if (cancelled) return;
        setMeta(m);
        // Snap defaults down to fit the source.
        setBitrate((b) => Math.min(b, m.bitrate));
        setMaxWidth((w) => (w === "original" || w <= m.width ? w : "original"));
        setMaxFps((f) => (f === "original" || f <= m.fps ? f : 24));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setProbeError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setProbing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Derived option lists — filtered to values <= source.
  const availableBitrates = meta
    ? BITRATE_LADDER.filter((b) => b <= meta.bitrate)
    : BITRATE_LADDER;
  const availableWidths = meta ? WIDTH_LADDER.filter((w) => w <= meta.width) : WIDTH_LADDER;
  const availableFps = meta ? FPS_LADDER.filter((f) => f <= meta.fps) : FPS_LADDER;

  async function onCompress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setPhase("decode");
    setPercent(0);

    if (result?.url) URL.revokeObjectURL(result.url);

    try {
      const info = await compressVideo(
        file,
        {
          targetBitrate: bitrate,
          maxWidth: maxWidth === "original" ? undefined : maxWidth,
          maxFps: maxFps === "original" ? undefined : maxFps,
        },
        (p, pct) => {
          setPhase(p);
          setPercent(pct);
        },
      );
      setResult({ blob: info.blob, url: URL.createObjectURL(info.blob), info });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }

  const phaseLabel = phase ? `${phase}… ${percent}%` : "";

  return (
    <section className="panel">
      <h2>Compress video</h2>

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

      {probing && <p className="meta">Probing source…</p>}
      {probeError && <p className="error">Probe failed: {probeError}</p>}

      {meta && (
        <p className="meta">
          Source: <strong>{meta.width}×{meta.height}</strong> · {meta.fps.toFixed(1)} fps ·{" "}
          {formatBitrate(meta.bitrate)} · {meta.durationSeconds.toFixed(1)} s · {meta.codec}
        </p>
      )}

      <div className="controls">
        <label>
          Bitrate
          <select
            value={bitrate}
            onChange={(e) => setBitrate(Number(e.target.value))}
            disabled={busy || !meta}
          >
            {availableBitrates.map((b) => (
              <option key={b} value={b}>
                {formatBitrate(b)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Max width
          <select
            value={maxWidth}
            onChange={(e) =>
              setMaxWidth(e.target.value === "original" ? "original" : Number(e.target.value))
            }
            disabled={busy || !meta}
          >
            <option value="original">Original{meta ? ` (${meta.width}px)` : ""}</option>
            {availableWidths.map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>
        </label>

        <label>
          Max fps
          <select
            value={maxFps}
            onChange={(e) =>
              setMaxFps(e.target.value === "original" ? "original" : Number(e.target.value))
            }
            disabled={busy || !meta}
          >
            <option value="original">Original{meta ? ` (${meta.fps.toFixed(1)})` : ""}</option>
            {availableFps.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button onClick={onCompress} disabled={!file || busy || probing || !!probeError}>
        {busy ? phaseLabel || "Working…" : "Compress"}
      </button>

      {busy && (
        <div className="progress">
          <div style={{ width: `${percent}%` }} />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result">
          <p>
            {formatBytes(result.info.originalBytes)} → {formatBytes(result.info.compressedBytes)} (
            {((1 - result.info.compressedBytes / result.info.originalBytes) * 100).toFixed(1)}%
            smaller) in {(result.info.durationMs / 1000).toFixed(1)}s
          </p>
          <video controls src={result.url} />
          <a href={result.url} download={`${file?.name ?? "video"}.compressed.mp4`}>
            Download MP4
          </a>
        </div>
      )}
    </section>
  );
}
