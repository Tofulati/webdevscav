// public/js/auth.js
// Very small guest-mode auth helper.
// If a real auth system is added later, replace this module.

(function() {
  function getOrCreateGuest() {
    let uid = localStorage.getItem('inspector_user');
    if (!uid) {
      uid = 'guest:' + cryptoRandomId();
      localStorage.setItem('inspector_user', uid);
    }
    return uid;
  }

  function cryptoRandomId() {
    // small helper for guest id
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // expose globally for other scripts
  window.InspectAuth = {
    getUserId: getOrCreateGuest
  };
})();
