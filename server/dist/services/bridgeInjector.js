const BRIDGE_SCRIPT = `
<script data-bridge="true">
(function() {
  'use strict';
  
  // ====== PREVENT NAVIGATION ======
  // We want to prevent the iframe from navigating away from the generated page
  window.addEventListener('click', function(e) {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) {
      e.preventDefault();
      console.info('[System] Link click intercepted: ' + (a.getAttribute('href') || '#'));
    }
  }, true);

  window.addEventListener('submit', function(e) {
    e.preventDefault();
    console.info('[System] Form submission intercepted');
  }, true);
})();
</script>`;
const SCRIPT_MOUNT_STYLE = `
<style data-webdevscav="script-mount-ui">
/* Inline scripts still execute inside this host; it only removes them from layout/paint. */
#webdevscav-simulated-root .webdevscav-script-mount{display:none!important}
</style>`;
/** Ensures .webdevscav-script-mount is non-rendering when generators wrap execution-only scripts there. */
export function injectScriptMountStyle(html) {
    const headClose = html.search(/<\/head>/i);
    if (headClose !== -1) {
        return html.slice(0, headClose) + SCRIPT_MOUNT_STYLE + '\n' + html.slice(headClose);
    }
    return html;
}
/**
 * Injects a small script to prevent the generated webpage from navigating away
 * when links are clicked or forms are submitted.
 */
export function injectBridgeScript(html) {
    const bodyCloseIndex = html.lastIndexOf('</body>');
    if (bodyCloseIndex !== -1) {
        return html.slice(0, bodyCloseIndex) + BRIDGE_SCRIPT + '\n' + html.slice(bodyCloseIndex);
    }
    return html + BRIDGE_SCRIPT;
}
