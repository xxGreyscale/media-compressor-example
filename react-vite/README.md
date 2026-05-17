# React + Vite example

A minimal Vite + React + TypeScript app that consumes [`@mdslabs/wc-media-compressor-sdk`](https://www.npmjs.com/package/@mdslabs/wc-media-compressor-sdk) **as a regular npm dependency** — there are no path links back to this repo, so this folder can be copied anywhere and used as a starter.

## Run

```bash
cd examples/react-vite
npm install --install-links   # see note below if you're using `file:../..`
npm run dev
```

> **Note on `file:../..`**
>
> When this example links the local SDK via `file:../..`, npm doesn't always install
> the SDK's transitive `dependencies` (like `@jsquash/oxipng` used for PNG optimisation).
> Pass `--install-links` to force npm to resolve them. Once the SDK is installed from
> npm (`"@mdslabs/wc-media-compressor-sdk": "latest"`), a plain `npm install` works.

Open the printed local URL. The app has three tabs:

- **Compress video** — H.264 MP4 / MOV → compressed H.264 MP4
- **Extract thumbnail** — best-looking frame, scored on sharpness + exposure
- **Compress image** — JPEG / PNG / WebP / HEIC → JPEG / WebP / PNG

All processing happens in-browser via WebCodecs. No file ever leaves the device.

## Browser support

Chrome 94+ or Safari 16.4+. Firefox will not work for video features (no WebCodecs). HEIC images fall back to a libheif WASM decoder on Firefox.

**HEVC video on Chrome** is supported via a libde265 WASM worker — the SDK auto-detects the codec and routes through the fallback. The worker decoder is lazy-loaded, so non-HEVC compressions never download it.

## Vite configuration note

When you import the SDK from your own Vite app you'll want to mirror this app's [vite.config.ts](vite.config.ts):

```ts
export default defineConfig({
  optimizeDeps: {
    exclude: ["@yume-chan/libde265"],
  },
});
```

Without it Vite's dependency pre-bundler chokes on the emscripten module. The exclusion is harmless even if you never compress HEVC video.

## Updating the SDK version

```bash
npm install @mdslabs/wc-media-compressor-sdk@latest
```

## What to look at

- [`src/panels/VideoPanel.tsx`](src/panels/VideoPanel.tsx) — `compressVideo` with phase/percent progress
- [`src/panels/ThumbnailPanel.tsx`](src/panels/ThumbnailPanel.tsx) — `extractThumbnail` with the four quality presets
- [`src/panels/ImagePanel.tsx`](src/panels/ImagePanel.tsx) — `compressImage` with multi-format output
