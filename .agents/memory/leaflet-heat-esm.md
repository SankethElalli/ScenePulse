---
name: Leaflet.heat ESM crash in Vite
description: leaflet.heat is a UMD plugin that reads window.L at load time — static ESM import crashes the module
---

## Rule
Never `import "leaflet.heat"` statically in a Vite ESM project. Always use dynamic import inside a useEffect, after assigning `(window as any).L = L`.

## Why
leaflet.heat's bundle runs `L.HeatLayer = (L.Layer ? L.Layer : L.Class).extend(...)` at the top level of its IIFE. In Vite/ESM, `L` from `import L from 'leaflet'` is a module-local binding — NOT `window.L`. When leaflet.heat executes, `L` is `undefined` globally, throwing a TypeError that crashes the entire importing module. All React components in that module fail to render, including all map pins.

## How to apply
```ts
// ✅ Correct — in a useEffect inside the component:
let heatPluginLoaded = false; // module-level flag

useEffect(() => {
  (window as any).L = L;          // 1. set global BEFORE import
  if (!heatPluginLoaded) {
    await import("leaflet.heat");  // 2. dynamic import runs plugin code now that window.L exists
    heatPluginLoaded = true;       // 3. cache — module system only runs once anyway
  }
  // use (L as any).heatLayer(...)
}, [deps]);
```
The module-level `heatPluginLoaded` flag avoids issuing a new `import()` call on every re-render, though the module cache handles deduplication anyway.
