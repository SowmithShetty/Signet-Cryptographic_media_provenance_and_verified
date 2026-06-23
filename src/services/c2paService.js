/**
 * C2PA WASM Service — Browser-side manifest reader
 *
 * Initializes the C2PA WebAssembly reader once and provides
 * a readManifest(file) function for extracting C2PA metadata
 * from media files entirely client-side.
 */

let c2paInstance = null;
let initPromise = null;

/**
 * Initialize the C2PA WASM reader (singleton).
 * Uses dynamic import to avoid blocking initial page load.
 */
async function initC2pa() {
  if (c2paInstance) return c2paInstance;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { createC2pa } = await import('@contentauth/c2pa-web');

      c2paInstance = await createC2pa({ wasmSrc: '/c2pa_bg.wasm' });
      console.log('[SIGNET] C2PA WASM reader initialized');
      return c2paInstance;
    } catch (err) {
      console.error('[SIGNET] Failed to initialize C2PA WASM:', err);
      initPromise = null; // allow retry
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Read C2PA manifest from a File/Blob.
 *
 * @param {File} file - The file to read
 * @returns {Promise<{manifest: object|null, error: string|null}>}
 */
export async function readManifest(file) {
  try {
    const c2pa = await initC2pa();

    const reader = await c2pa.reader.fromBlob(file.type, file);
    const manifestStore = await reader.manifestStore();

    // Free WASM resources to prevent memory leaks
    await reader.free();

    if (!manifestStore || !manifestStore.active_manifest) {
      return {
        manifest: null,
        error: null,
        message: 'No C2PA metadata found in this file',
      };
    }

    return {
      manifest: manifestStore,
      error: null,
      message: null,
    };
  } catch (err) {
    // Handle files without C2PA data gracefully
    const errorMsg = err?.message || String(err);

    // Common error when file has no C2PA data
    if (
      errorMsg.includes('no C2PA') ||
      errorMsg.includes('JumbfNotFound') ||
      errorMsg.includes('not found') ||
      errorMsg.includes('No manifest')
    ) {
      return {
        manifest: null,
        error: null,
        message: 'No C2PA metadata found in this file',
      };
    }

    console.error('[SIGNET] C2PA read error:', err);
    return {
      manifest: null,
      error: `Failed to read C2PA data: ${errorMsg}`,
      message: null,
    };
  }
}

/**
 * Pre-warm the WASM reader (call on app startup for faster first read).
 */
export async function preloadC2pa() {
  try {
    await initC2pa();
  } catch {
    // Silently fail — will retry on first readManifest() call
  }
}
