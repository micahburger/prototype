/*
 * protostate.js — the only coupling between a prototype and the prototype
 * viewer. No dependencies, no build step, no module syntax, so the same file
 * works three ways:
 *
 *   <script src="https://prototypes.micahburger.com/helper/protostate.js"></script>
 *   <script src="/js/protostate.js"></script>          (a copy in the prototype)
 *   import "./protostate.js";                          (a bundled app; then use
 *                                                        window.protostate, or
 *                                                        the useProtoState hook)
 *
 * It is a no-op outside the viewer: getState returns the default, the
 * callbacks never fire, nothing is posted. A prototype that adopts it still
 * runs standalone exactly as before.
 *
 * API (window.protostate):
 *   getState(groupId, defaultId)  -> optionId
 *   onStateChange(cb)             -> unsubscribe; cb(state) on live changes
 *   onAction(actionId, cb)        -> unsubscribe
 *   onReset(cb)                   -> unsubscribe; for in-memory data
 *   reportScreen(screenId)        tell the viewer which manifest screen this is
 *
 * Wire format, all via postMessage:
 *   viewer -> prototype  { type: "prototype:set-state", state }   (liveStates only)
 *                        { type: "prototype:action", id }
 *                        { type: "prototype:reset", storageKeys }
 *   prototype -> viewer  { type: "prototype:ready" | "prototype:navigate", path }
 *                        { type: "prototype:screen", screenId, path }
 *                        { type: "prototype:reset-done" }
 *                        { type: "prototype:activity" }
 */
(function () {
  if (window.protostate) return;

  var PARAM = "state.";
  // Namespaced so a Reset that clears "everything" leaves it alone — the
  // viewer and the helper share this rule for their own keys.
  var SESSION_KEY = "protoviewer:state";
  var inViewer = window.parent !== window;

  var state = readInitialState();
  var stateListeners = [];
  var actionListeners = {};
  var resetListeners = [];

  // Selections arrive as ?state.<group>=<option> on the URL the viewer loads.
  // A multi-page prototype loses them on its first full-page link, so they're
  // mirrored into sessionStorage and picked back up — but only when the page
  // was reached from inside the same prototype (same-origin referrer). A load
  // the viewer started has the viewer as its referrer, so a viewer reload with
  // a clean URL really does mean "all defaults", not "whatever was last set".
  function readInitialState() {
    var fromUrl = {};
    var any = false;
    new URLSearchParams(location.search).forEach(function (value, key) {
      if (key.indexOf(PARAM) === 0) {
        fromUrl[key.slice(PARAM.length)] = value;
        any = true;
      }
    });
    if (!inViewer) return fromUrl;
    if (any) {
      save(fromUrl);
      return fromUrl;
    }
    var internal = false;
    try {
      internal = !!document.referrer && new URL(document.referrer).origin === location.origin;
    } catch (e) {}
    if (internal) {
      try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
      } catch (e) {}
    }
    save({});
    return {};
  }

  function save(next) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch (e) {}
  }

  function post(message) {
    if (!inViewer) return;
    try {
      window.parent.postMessage(message, "*");
    } catch (e) {}
  }

  function currentPath() {
    return location.pathname + location.search + location.hash;
  }

  function clearStorage(prefixes) {
    [localStorage, sessionStorage].forEach(function (store) {
      try {
        var keys = [];
        for (var i = 0; i < store.length; i++) keys.push(store.key(i));
        keys.forEach(function (key) {
          if (key.indexOf("protoviewer:") === 0) return;
          var match = prefixes && prefixes.length
            ? prefixes.some(function (p) { return key.indexOf(p) === 0; })
            : true;
          if (match) store.removeItem(key);
        });
      } catch (e) {}
    });
  }

  window.addEventListener("message", function (event) {
    // Only the frame that hosts us gets to drive us.
    if (event.source !== window.parent) return;
    var data = event.data;
    if (!data || typeof data.type !== "string") return;

    if (data.type === "prototype:set-state" && data.state) {
      state = data.state;
      save(state);
      stateListeners.slice().forEach(function (cb) { cb(state); });
    } else if (data.type === "prototype:action") {
      (actionListeners[data.id] || []).slice().forEach(function (cb) { cb(); });
    } else if (data.type === "prototype:reset") {
      clearStorage(data.storageKeys);
      save({});
      resetListeners.slice().forEach(function (cb) { cb(); });
      post({ type: "prototype:reset-done" });
    }
  });

  // The viewer is cross-origin to most prototypes, so it can't read the
  // frame's location. Report every client-side route change instead: wrap
  // the history methods (most SPA routers end up there) and listen for
  // back/forward and hash changes.
  if (inViewer) {
    var lastPath = null;
    var report = function () {
      var path = currentPath();
      if (path === lastPath) return;
      lastPath = path;
      post({ type: "prototype:navigate", path: path });
    };
    ["pushState", "replaceState"].forEach(function (name) {
      var original = history[name];
      history[name] = function () {
        var result = original.apply(this, arguments);
        report();
        return result;
      };
    });
    window.addEventListener("popstate", report);
    window.addEventListener("hashchange", report);

    lastPath = currentPath();
    post({ type: "prototype:ready", path: lastPath });

    // Pointer movement inside a cross-origin frame never reaches the
    // viewer, so its full-screen pill would never wake up. Nudge it, at
    // most a few times a second.
    var lastActivity = 0;
    window.addEventListener("pointermove", function () {
      var now = Date.now();
      if (now - lastActivity < 300) return;
      lastActivity = now;
      post({ type: "prototype:activity" });
    }, { passive: true });
  }

  function subscribe(list, cb) {
    list.push(cb);
    return function () {
      var i = list.indexOf(cb);
      if (i >= 0) list.splice(i, 1);
    };
  }

  window.protostate = {
    getState: function (groupId, defaultId) {
      return Object.prototype.hasOwnProperty.call(state, groupId) ? state[groupId] : defaultId;
    },
    onStateChange: function (cb) {
      return subscribe(stateListeners, cb);
    },
    onAction: function (actionId, cb) {
      if (!actionListeners[actionId]) actionListeners[actionId] = [];
      return subscribe(actionListeners[actionId], cb);
    },
    onReset: function (cb) {
      return subscribe(resetListeners, cb);
    },
    reportScreen: function (screenId) {
      post({ type: "prototype:screen", screenId: screenId, path: currentPath() });
    },
  };
})();
