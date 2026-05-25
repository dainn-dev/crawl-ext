/*! instantDataScraper - 2018-02-26 */

function a(a) {
  return Math.max.apply(null, Object.keys(a).map(function(b) {
      return a[b]
  }))
}

function b(a, b) {
  return (b || ".") + a.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&").trim()
}

function c(a) {
  return (a.attr("class") || "").trim().split(/\s+/).filter(function(a) {
      return a
  })
}

function d(a) {
  function b(a, b) {
      for (var c = b.split(" "), d = 0; d < c.length; d++)
          if (!a.hasClass(c[d])) return !1;
      return !0
  }
  var d = $(a).children(),
      e = {},
      f = {};
  d.each(function() {
      if (!["script", "img"].includes(this.nodeName.toLowerCase()) && $(this).text().trim().length) {
          var a = c($(this)).sort().filter(function(a) {
                  return !a.match(/\d/)
              }),
              b = a.join(" ");
          b in f || (f[b] = 0), f[b]++, a.forEach(function(a) {
              a in e || (e[a] = 0), e[a]++
          })
      }
  });
  var g = Object.keys(f).filter(function(a) {
      return f[a] >= d.length / 2 - 2
  });
  return g.length || (g = Object.keys(e).filter(function(a) {
      return e[a] >= d.length / 2 - 2
  })), d.filter(function() {
      var a = !1,
          c = $(this);
      return g.forEach(function(d) {
          a |= b(c, d)
      }), a
  })
}

function e() {
  m.length || ($("body *").each(function() {
      var a = $(this).width() * $(this).height(),
          b = d(this),
          c = b.length,
          e = a * c * c;
      isNaN(e) || (m.push({
          table: this,
          area: a,
          children: b,
          text: b.text(),
          score: e,
          selector: i(this)
      }), bestArea = a, bestScore = e, bestChildren = b, bestTable = this)
  }), m = m.sort(function(a, b) {
      return a.score > b.score ? -1 : a.score < b.score ? 1 : 0
  }).slice(0, o), console.log("Best tables:", m))
}

function f() {
  var a = (n + m.length - 1) % m.length;
  $(m[a].table).removeClass("tablescraper-selected-table"), $(m[a].children).removeClass("tablescraper-selected-row"), $(m[n].table).addClass("tablescraper-selected-table"), $(m[n].children).addClass("tablescraper-selected-row")
}

function g(a) {
  return a.clone().children().remove().end().text()
}

function h(a, b) {
  var e;
  if (b) {
      var i = findBySelector(b);
      if (!i) return a({
          error: "Table not found"
      }), console.log("Table not found");
      m.length || (m = [{}]);
      var j = d(i);
      return i.is($(m[n].table)) && j.text() == m[n].text ? (a({
          error: "Table not changed. Try to increase crawl delay"
      }), console.log("Table not changed")) : (m[n].table = i, m[n].children = j, m[n].text = j.text(), f(), void h(a))
  }
  e = m[n].children;
  var k = [];
  e.each(function() {
      function a(a, b, c) {
          if (a) {
              for (var e = b + (c ? " " + c : ""), f = e, g = 1; f in d;) f = e + " " + ++g;
              d[f] = a
          }
      }

      function b(d, e) {
          d.children().each(function() {
              var d = $(this),
                  f = e + "/" + this.nodeName.toLowerCase() + c(d).map(function(a) {
                      return "." + a
                  }).join("");
              a(g(d).trim(), f), a(d.prop("href"), f, "href"), a(d.prop("src"), f, "src"), b(d, f)
          })
      }
      var d = {};
      $(this);
      b($(this), ""), Object.keys(d).length && k.push(d)
  }), console.log("Collected table data:", k), a({
      data: k,
      tableId: n,
      tableSelector: m[n].selector
  })
}

// Classes added dynamically by frameworks or this extension itself.
// Including them in a captured selector makes it stop matching once
// focus/hover state changes — which is what made earlier picks brittle.
var UNSTABLE_CLASS_PATTERNS = [
  /^cdk-/,            // Angular CDK runtime state (cdk-focused, cdk-mouse-focused, ...)
  /^ng-/,             // Angular form/binding state (ng-touched, ng-dirty, ...)
  /^mat-focus/,       // Material focus indicator
  /^tablescraper-/,   // Classes this extension itself adds
  /^is-/, /^has-/,    // Common BEM-ish state modifiers
  /(^|-)focus(ed)?$/i,
  /(^|-)hover(ed)?$/i,
  /(^|-)active$/i,
  /(^|-)selected$/i,
  /(^|-)open(ed)?$/i,
  /(^|-)disabled$/i
];
function isStableClass(c) {
  if (!c) return false;
  for (var i = 0; i < UNSTABLE_CLASS_PATTERNS.length; i++) {
      if (UNSTABLE_CLASS_PATTERNS[i].test(c)) return false;
  }
  return true;
}
// An ID is considered stable unless it looks like a random hash/UUID.
function isStableId(id) {
  if (!id || !id.trim()) return false;
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) return false;
  if (/^[a-z0-9]{20,}$/i.test(id)) return false;
  return true;
}

function i(a) {
  var parts = [];
  var node = a;
  while (node && node.nodeType === 1 && node.tagName) {
      var tag = node.tagName.toLowerCase();
      if (tag === "html" || tag === "body") break;
      var seg = tag;
      var id = (typeof node.id === "string") ? node.id.trim() : "";
      var hitUniqueId = false;
      if (isStableId(id)) {
          var idSel = b(id, "#");
          seg += idSel;
          try {
              if (document.querySelectorAll(idSel).length === 1) hitUniqueId = true;
          } catch (e) {}
      } else {
          var className = "";
          if (typeof node.className === "string") className = node.className.trim();
          else if (node.className && typeof node.className.baseVal === "string") className = node.className.baseVal.trim();
          if (className) {
              var stable = className.split(/\s+/).filter(isStableClass);
              if (stable.length) {
                  seg += stable.map(function(c) { return b(c, "."); }).join("");
              }
          }
      }
      parts.unshift(seg);
      if (hitUniqueId) break;
      node = node.parentNode;
  }
  return parts.join(" > ");
}

var pickerActive = false;
var pickerCallback = null;
var pickerBanner = null;
var pickerBadge = null;
var pickerPreviewEl = null;

function isPickerUI(el) {
  return !!(el && el.closest && (el.closest(".tablescraper-picker-banner") || el.closest(".tablescraper-picker-badge")));
}

function teardownPicker() {
  $("*").off("click.tps").off("mouseenter.tps").off("mousemove.tps");
  $(document).off("keydown.tps");
  $(window).off("scroll.tps resize.tps");
  $(".tablescraper-hover").removeClass("tablescraper-hover");
  if (pickerBanner && pickerBanner.parentNode) pickerBanner.parentNode.removeChild(pickerBanner);
  if (pickerBadge && pickerBadge.parentNode) pickerBadge.parentNode.removeChild(pickerBadge);
  document.documentElement.classList.remove("tablescraper-picker-active");
  pickerBanner = null;
  pickerBadge = null;
  pickerPreviewEl = null;
  pickerActive = false;
}

function positionBadgeFor(el) {
  if (!pickerBadge || !el) return;
  var rect = el.getBoundingClientRect();
  pickerBadge.style.display = "block";
  var top = window.scrollY + rect.bottom + 4;
  var left = window.scrollX + rect.left;
  // Keep badge inside viewport horizontally
  var bw = pickerBadge.offsetWidth || 200;
  var maxLeft = window.scrollX + document.documentElement.clientWidth - bw - 8;
  if (left > maxLeft) left = maxLeft;
  if (left < window.scrollX + 4) left = window.scrollX + 4;
  pickerBadge.style.top = top + "px";
  pickerBadge.style.left = left + "px";
}

function j(a) {
  // If a previous picker is still active, tear it down and resolve it as cancelled
  if (pickerActive && pickerCallback) {
      try { pickerCallback({ cancelled: true }); } catch (e) {}
  }
  teardownPicker();

  pickerActive = true;
  pickerCallback = a;
  window.focus();
  document.documentElement.classList.add("tablescraper-picker-active");

  // Build banner
  pickerBanner = document.createElement("div");
  pickerBanner.className = "tablescraper-picker-banner";
  var msg = document.createElement("span");
  msg.className = "tps-msg";
  msg.innerHTML = "Click an element to capture &nbsp;|&nbsp; press <b>ESC</b> to cancel";
  var preview = document.createElement("span");
  preview.className = "tps-preview";
  pickerPreviewEl = preview;
  var cancelBtn = document.createElement("button");
  cancelBtn.className = "tps-cancel";
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  pickerBanner.appendChild(msg);
  pickerBanner.appendChild(preview);
  pickerBanner.appendChild(cancelBtn);
  document.body.appendChild(pickerBanner);

  // Build floating badge
  pickerBadge = document.createElement("div");
  pickerBadge.className = "tablescraper-picker-badge";
  pickerBadge.style.display = "none";
  document.body.appendChild(pickerBadge);

  function finish(payload) {
      var cb = pickerCallback;
      teardownPicker();
      pickerCallback = null;
      if (cb) try { cb(payload); } catch (e) {}
  }

  cancelBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      finish({ cancelled: true });
  }, true);

  // ESC cancels
  $(document).on("keydown.tps", function(e) {
      if (e.key === "Escape" || e.keyCode === 27) {
          e.preventDefault();
          e.stopPropagation();
          finish({ cancelled: true });
      }
  });

  // Reposition badge on scroll/resize (for the last hovered element)
  var lastHovered = null;
  $(window).on("scroll.tps resize.tps", function() {
      if (lastHovered) positionBadgeFor(lastHovered);
  });

  // Hover preview
  q = function(ev) {
      if (isPickerUI(ev.target)) return;
      $(".tablescraper-hover").removeClass("tablescraper-hover");
      ev.target.classList.add("tablescraper-hover");
      lastHovered = ev.target;
      var sel = i(ev.target);
      if (pickerPreviewEl) pickerPreviewEl.textContent = sel;
      if (pickerBadge) {
          pickerBadge.textContent = sel;
          positionBadgeFor(ev.target);
      }
  };

  // Click capture — block the page's own click handlers and capture target
  p = function(ev) {
      if (isPickerUI(ev.target)) return;
      ev.preventDefault();
      ev.stopPropagation();
      var sel = i(ev.target);
      console.log("Next button selector:", sel);
      // Briefly mark the picked element
      ev.target.classList.add("tablescraper-next-button");
      finish({ selector: sel });
      return false;
  };

  $("*").on("click.tps", p).on("mouseenter.tps", q);
}

function k(a) {
  var b = document.createEvent("MouseEvents");
  b.initMouseEvent("mousedown", !0, !0, window, 1, a.x, a.y, a.x, a.y, !1, !1, !1, !1, 0, null);
  var c = document.createEvent("MouseEvents");
  c.initMouseEvent("click", !0, !0, window, 1, a.x, a.y, a.x, a.y, !1, !1, !1, !1, 0, null);
  var d = document.createEvent("MouseEvents");
  d.initMouseEvent("mouseup", !0, !0, window, 1, a.x, a.y, a.x, a.y, !1, !1, !1, !1, 0, null), a.dispatchEvent(b), a.dispatchEvent(c), a.dispatchEvent(d)
}

// Resolve a selector to a jQuery set. Tries the selector as-is first
// (so DevTools-style selectors using '>' work), then falls back to the
// legacy left-trim strategy for space-separated descendant selectors.
function findBySelector(sel) {
  if (!sel) return null;
  try {
      var $el = $(sel);
      if ($el.length) return $el;
  } catch (e) {}
  var s = sel;
  while (s.length) {
      var parts = s.split(/\s+/);
      if (parts.length <= 1) break;
      s = parts.slice(1).join(" ").replace(/^[>+~]\s*/, "").trim();
      if (!s) break;
      try {
          var $el2 = $(s);
          if ($el2.length) return $el2;
      } catch (e) {}
  }
  return null;
}

function l(a, b, c) {
  var d = findBySelector(a);
  return d ? (d.last().addClass("tablescraper-next-button"), c ? b({}) : ($("*").off("click", p).off("mouseenter", q), void setTimeout(function() {
      k(d.last()[0]), b({})
  }, 100))) : b({
      error: c ? "Next button not found" : "No more next buttons: Finished crawling. Download CSV or Excel file"
  })
}
var m = [],
  n = 0,
  o = 5,
  p, q, r = !1;
chrome.runtime.onMessage.addListener(function(a, b, c) {
  console.log("Got request", a);
  if ("nextTable" == a.action || "findTables" == a.action) {
      "findTables" == a.action ? e() : n = (n + 1) % m.length;
      f();
      c({
          tableId: n,
          tableCount: m.length,
          tableSelector: m[n].selector,
          href: window.location.href,
          hostname: window.location.hostname
      });
      return true;
  }
  if ("getTableData" == a.action) {
      h(c, a.selector);
      return true;
  }
  if ("getNextButton" == a.action) {
      j(c);
      return true;
  }
  if ("cancelPicker" == a.action) {
      var wasActive = pickerActive;
      var cb = pickerCallback;
      teardownPicker();
      pickerCallback = null;
      if (wasActive && cb) try { cb({ cancelled: true }); } catch (e) {}
      c({ cancelled: wasActive });
      return true;
  }
  if ("clickNext" == a.action) {
      l(a.selector, c);
      return true;
  }
  if ("markNextButton" == a.action) {
      l(a.selector, c, !0);
      return true;
  }
  if ("checkNextPageExists" == a.action) {
      var selector = a.selector;
      var nextElement = $(selector);
      var exists = nextElement.length > 0 && nextElement.is(':visible');
      console.log("Checking next page existence for selector:", selector, "Result:", exists);
      c({
          exists: exists
      });
      return true;
  }
  if ("test" == a.action) {
      console.log("Test message received in content script");
      c({
          status: "ok",
          message: "Content script is working"
      });
      return true;
  }
  c({});
  return false;
});
console.log("Table scraper loaded."), chrome.runtime.sendMessage({
  state: "loaded"
}, function(a) {});