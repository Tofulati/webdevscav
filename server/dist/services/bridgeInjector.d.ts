/** Ensures .webdevscav-script-mount is non-rendering when generators wrap execution-only scripts there. */
export declare function injectScriptMountStyle(html: string): string;
/**
 * Injects a small script to prevent the generated webpage from navigating away
 * when links are clicked or forms are submitted.
 */
export declare function injectBridgeScript(html: string): string;
