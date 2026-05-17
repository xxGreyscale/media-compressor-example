import { useState } from "react";
import { VideoPanel } from "./panels/VideoPanel";
import { ThumbnailPanel } from "./panels/ThumbnailPanel";
import { ImagePanel } from "./panels/ImagePanel";

type Tab = "video" | "thumbnail" | "image";

export function App() {
  const [tab, setTab] = useState<Tab>("video");

  return (
    <div className="app">
      <header>
        <h1>@mdslabs/wc-media-compressor-sdk</h1>
        <p className="subtitle">
          React + Vite example — all processing runs in the browser via WebCodecs.
        </p>
      </header>

      <nav className="tabs">
        <button onClick={() => setTab("video")} className={tab === "video" ? "active" : ""}>
          Compress video
        </button>
        <button
          onClick={() => setTab("thumbnail")}
          className={tab === "thumbnail" ? "active" : ""}
        >
          Extract thumbnail
        </button>
        <button onClick={() => setTab("image")} className={tab === "image" ? "active" : ""}>
          Compress image
        </button>
      </nav>

      <main>
        {tab === "video" && <VideoPanel />}
        {tab === "thumbnail" && <ThumbnailPanel />}
        {tab === "image" && <ImagePanel />}
      </main>
    </div>
  );
}
