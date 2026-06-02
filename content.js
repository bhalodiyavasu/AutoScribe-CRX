(async () => {
  if (window.__copilotxRunning) return;
  window.__copilotxRunning = true;

  const D = window.COPILOTX_DATA;
  if (!D) { window.__copilotxRunning = false; return; }

  // ── Constants ──────────────────────────────────────────────────────────────
  const THEME        = '#22c55e';
  const GLOW_MS      = 1000;
  const TAB_WAIT_MS  = 420;
  const VERIFY_MS    = 420;

  // ── Utilities ─────────────────────────────────────────────────────────────
  const sleep  = ms => new Promise(r => setTimeout(r, ms));
  const norm   = s  => D._norm(s);
  const clean  = s  => s.replace(/[*\s]+$/g, '').trim();

  // ── Animation styles (injected once) ──────────────────────────────────────
  if (!document.getElementById('__cpx_style')) {
    const s = document.createElement('style');
    s.id = '__cpx_style';
    s.textContent = `
      @keyframes __cpx_in  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes __cpx_out { from{transform:translateX(0);opacity:1}    to{transform:translateX(110%);opacity:0} }
    `;
    document.head.appendChild(s);
  }

  // ── Label resolution ──────────────────────────────────────────────────────
  // Priority: aria-label → aria-labelledby → label[for] → ancestor label → data attrs
  // Covers: plain HTML, React, Next.js, Vue, Angular, Shadcn, MUI, Ant Design, Headless UI
  const getLabel = el => {
    const aria = el.getAttribute('aria-label');
    if (aria) return clean(aria);

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const txt = labelledBy.split(/\s+/)
        .map(id => document.getElementById(id)?.textContent ?? '')
        .join(' ').trim();
      if (txt) return clean(txt);
    }

    if (el.id) {
      const linked = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (linked) return clean(linked.textContent);
    }

    let node = el.parentElement;
    for (let i = 0; i < 10; i++) {
      if (!node || node === document.body) break;
      const lbl = node.querySelector('label');
      if (lbl) return clean(lbl.textContent);
      const fallback = node.getAttribute('data-label') || node.getAttribute('title');
      if (fallback) return clean(fallback);
      node = node.parentElement;
    }

    return '';
  };

  const getKey = el => (el.name || el.id || el.getAttribute('data-name') || '').trim();

  // ── Visibility check ──────────────────────────────────────────────────────
  // Walk ancestors for display:none/visibility:hidden — does NOT use offsetParent
  // because offsetParent is null inside position:fixed modals/dialogs, causing
  // all inputs there to be skipped incorrectly.
  const isVisible = el => {
    let n = el;
    while (n && n !== document.body) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      n = n.parentElement;
    }
    // getBoundingClientRect works correctly for fixed/absolute elements
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };

  // Lighter check for backing inputs (e.g. hidden date input inside a custom picker)
  // Only rejects elements that are truly invisible via display:none on an ancestor.
  const isInDom = el => {
    if (!document.contains(el)) return false;
    let n = el;
    while (n && n !== document.body) {
      if (getComputedStyle(n).display === 'none') return false;
      n = n.parentElement;
    }
    return true;
  };

  const shouldSkip = el => {
    if (el.disabled || el.readOnly) return true;
    const t = (el.type || '').toLowerCase();
    if (['hidden','submit','button','file','radio','password','image','reset'].includes(t)) return true;
    const k = (el.name || el.id || el.placeholder || '').toLowerCase();
    return k.includes('search') || k.includes('filter') || (el.maxLength > 0 && el.maxLength <= 1);
  };

  // ── Visual feedback ───────────────────────────────────────────────────────
  /*
   * findVisualTarget — walks up to the nearest styled ancestor.
   * For custom inputs/selects where the visual border lives on a wrapper div.
   */
  const findVisualTarget = el => {
    const elRect = el.getBoundingClientRect();
    const elH = elRect.height || 1;
    let target = el, node = el.parentElement;
    for (let i = 0; i < 5; i++) {
      if (!node || node === document.body) break;
      const rect = node.getBoundingClientRect();
      if (rect.height > elH * 2.8) break;
      const cs = getComputedStyle(node);
      const hasBorder = cs.borderStyle !== 'none' && parseFloat(cs.borderWidth) > 0;
      const hasRadius = parseFloat(cs.borderRadius) > 0;
      if (hasBorder || hasRadius) { target = node; break; }
      node = node.parentElement;
    }
    return target;
  };

  /*
   * applyGlow — uses outline which natively follows border-radius in Chrome.
   * Falls back to box-shadow for elements where outline is suppressed by CSS.
   * 'important' ensures it overrides any framework styles.
   */
  const applyGlow = el => {
    el.style.setProperty('outline',        `2px solid ${THEME}`, 'important');
    el.style.setProperty('outline-offset', '2px',                'important');
    el.style.setProperty('box-shadow',     `inset 0 0 0 1px ${THEME}33`, 'important');
    return () => {
      el.style.removeProperty('outline');
      el.style.removeProperty('outline-offset');
      el.style.removeProperty('box-shadow');
    };
  };

  /*
   * glow — applies highlight immediately after fill so React's synchronous
   * reconciliation (already done by the time setVal returns) cannot race with it.
   * wrapped=true  → find the visual container (date, custom select, custom input)
   * wrapped=false → apply directly on el (text, number, email, tel)
   */
  const glow = (el, wrapped = false) => {
    const target = wrapped ? findVisualTarget(el) : el;
    if (!document.contains(target)) return;
    const cleanup = applyGlow(target);
    setTimeout(cleanup, GLOW_MS);
  };

  // ── Framework-agnostic value setter ───────────────────────────────────────
  /*
   * Three-layer approach:
   *   1. Native prototype setter  → bypasses React/Vue read-only descriptor
   *   2. Full DOM event chain     → Vue, Angular, vanilla JS all listen here
   *   3. React fiber direct call  → controlled components, react-hook-form,
   *      custom date pickers that ignore DOM events
   */
  const setVal = (el, val) => {
    const proto =
      el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype :
      el.tagName === 'SELECT'   ? HTMLSelectElement.prototype   :
                                  HTMLInputElement.prototype;

    const nativeSet = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    // Wrap in try-catch: setting a non-numeric string on input[type="number"],
    // or an invalid date on input[type="date"], throws a DOMException.
    try {
      if (nativeSet) nativeSet.call(el, val); else el.value = val;
    } catch (_) { return; }

    ['input', 'change', 'blur'].forEach(type =>
      el.dispatchEvent(new Event(type, { bubbles: true }))
    );

    try {
      const fk = Object.keys(el).find(k =>
        k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
      );
      if (!fk) return;
      let fiber = el[fk];
      while (fiber) {
        const mp = fiber.memoizedProps;
        if (mp && !mp.options) {
          if (typeof mp.onChange === 'function') {
            mp.onChange({ target: el, currentTarget: el, type: 'change', nativeEvent: new Event('change') });
            break;
          }
          if (mp?.control && typeof mp.name === 'string') {
            try {
              if (typeof mp.control._setFieldValue === 'function') {
                mp.control._setFieldValue(mp.name, val);
                mp.control._subjects?.values?.next?.({
                  name: mp.name,
                  values: { ...mp.control._formValues, [mp.name]: val },
                });
                break;
              }
            } catch (_) {}
          }
        }
        fiber = fiber.return;
      }
    } catch (_) {}
  };

  // ── Simulated pointer events ───────────────────────────────────────────────
  const tap = el => {
    if (!el) return;
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(type =>
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }))
    );
  };

  // ── React fiber: fill controlled select/dropdown ──────────────────────────
  const fillViaFiber = (trigger, pickFn) => {
    try {
      const fk = Object.keys(trigger).find(k =>
        k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
      );
      if (!fk) return false;
      let fiber = trigger[fk];
      while (fiber) {
        const mp = fiber.memoizedProps;
        if (mp?.options && Array.isArray(mp.options) && mp.options.length > 0) {
          const flat = mp.options
            .flatMap(o => (o.data && Array.isArray(o.data)) ? o.data : [o])
            .filter(o => !o.disabled);
          if (!flat.length) { fiber = fiber.return; continue; }
          const chosen = pickFn(flat);
          if (!chosen) { fiber = fiber.return; continue; }
          if (typeof mp.onChange === 'function' && !mp.control) {
            mp.onChange(chosen.value ?? chosen);
            return true;
          }
          if (mp.control && typeof mp.name === 'string') {
            try {
              const r = mp.control.register(mp.name);
              if (typeof r?.onChange === 'function') { r.onChange(chosen.value ?? chosen); return true; }
            } catch (_) {}
            try {
              if (typeof mp.control._setFieldValue === 'function') {
                mp.control._setFieldValue(mp.name, chosen.value ?? chosen);
                mp.control._subjects?.values?.next?.({
                  name: mp.name,
                  values: { ...mp.control._formValues, [mp.name]: chosen.value ?? chosen },
                });
                return true;
              }
            } catch (_) {}
          }
        }
        fiber = fiber.return;
      }
    } catch (_) {}
    return false;
  };

  // ── Overlay item collector (framework-agnostic) ────────────────────────────
  const getOverlayItems = () =>
    Array.from(document.querySelectorAll('[role="menuitem"],[role="option"]')).filter(el =>
      !el.hasAttribute('data-disabled') &&
      el.getAttribute('aria-disabled') !== 'true' &&
      el.textContent.trim() &&
      !/^(no data|no result|no option|no item|select|choose)/i.test(el.textContent.trim())
    );

  // ── Silent overlay fallback ────────────────────────────────────────────────
  /*
   * Opens the dropdown, waits for portal, picks an item — all while hiding
   * the popup so the user doesn't see a flash. Covers Radix, MUI, Ant Design,
   * Headless UI, and any custom portal-based dropdown.
   */
  const silentSelectFallback = async (trigger, pickFn) => {
    let portal = null;

    const hideEl = node => {
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('animation',  'none',   'important');
      node.style.setProperty('transition', 'none',   'important');
    };

    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          const hasItems = node.querySelector?.('[role="listbox"],[role="menu"],[role="menuitem"],[role="option"]');
          const isPortal = 'radixPopperContentWrapper' in (node.dataset ?? {}) || hasItems;
          if (isPortal) { hideEl(node); portal = node; }
        }
      }
    });

    obs.observe(document.body, { childList: true });
    tap(trigger);
    await sleep(280);
    obs.disconnect();

    const items = getOverlayItems();
    const chosen = pickFn(items);
    if (chosen) {
      tap(chosen);
    } else {
      // Close without firing Escape on document (would close modals/sidebars)
      tap(trigger);
    }

    await sleep(120);
    if (portal) portal.style.visibility = '';
  };

  // ── Unified dropdown filler ────────────────────────────────────────────────
  const fillDropdown = async (trigger, label, pickFn) => {
    // Try React fiber first (zero-flash, works for most RHF / controlled components)
    if (fillViaFiber(trigger, pickFn)) return;

    // Try smart label-aware fiber pick
    const key = getKey(trigger), lbl = label || getLabel(trigger);
    const smartPick = flat => {
      const resolved = D.resolveSelect(key, lbl, flat.map(o => ({ text: o.label ?? String(o.value ?? o), value: o.value ?? o })));
      return resolved ?? D.pick(flat);
    };
    if (fillViaFiber(trigger, smartPick)) return;

    // DOM overlay fallback
    await silentSelectFallback(trigger, items => {
      if (!items.length) return null;
      const resolved = D.resolveSelect(key, lbl, items.map(o => ({ text: o.textContent.trim(), value: o.getAttribute('data-value') ?? o.textContent.trim() })));
      if (resolved) {
        const text = resolved.text ?? resolved.value ?? resolved;
        return items.find(i => i.textContent.trim() === String(text)) ?? D.pick(items);
      }
      return D.pick(items);
    });
  };

  // ── Toast notification ────────────────────────────────────────────────────
  const showToast = count => {
    document.getElementById('__cpx_toast')?.remove();
    const el = document.createElement('div');
    el.id = '__cpx_toast';
    el.textContent = `CopilotX: ${count} field${count !== 1 ? 's' : ''} filled`;
    Object.assign(el.style, {
      position:   'fixed',
      top:        '20px',
      right:      '20px',
      background: THEME,
      color:      '#14532d',
      padding:    '10px 18px',
      borderRadius: '8px',
      fontSize:   '14px',
      fontWeight: '600',
      fontFamily: 'system-ui,-apple-system,sans-serif',
      zIndex:     '2147483647',
      animation:  '__cpx_in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      pointerEvents: 'none',
      boxShadow:  '0 4px 16px rgba(34,197,94,0.3)',
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.animation = '__cpx_out 0.35s ease forwards'; }, 2600);
    setTimeout(() => el.remove(), 3000);
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let filledCount = 0;
  const filledEls = new Set();

  // ═══════════════════════════════════════════════════════════════════════════
  //  resetScope — clears all existing field data before filling
  // ═══════════════════════════════════════════════════════════════════════════
  const resetScope = scope => {
    // Clear text / number / email / tel / textarea inputs
    Array.from(scope.querySelectorAll(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="file"])' +
      ':not([type="hidden"]):not([type="submit"]):not([type="button"])' +
      ':not([type="image"]):not([type="reset"]):not([type="password"])' +
      ':not([disabled]):not([readonly]),' +
      'textarea:not([disabled]):not([readonly])'
    )).filter(el => !shouldSkip(el) && (isVisible(el) || isInDom(el))).forEach(el => {
      try {
        setVal(el, '');
      } catch (_) {}
    });

    // Reset native <select> to first option
    scope.querySelectorAll('select:not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      try {
        if (el.options.length > 0) setVal(el, el.options[0].value);
      } catch (_) {}
    });

    // Uncheck all checkboxes
    scope.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      if (el.checked) {
        try {
          const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
          if (desc?.set) desc.set.call(el, false); else el.checked = false;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {}
      }
    });

    // Uncheck all radio buttons
    scope.querySelectorAll('input[type="radio"]:not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      if (el.checked) {
        try {
          const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
          if (desc?.set) desc.set.call(el, false); else el.checked = false;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {}
      }
    });

    // Reset custom toggles [role="switch"] / [role="checkbox"]
    scope.querySelectorAll('[role="switch"]:not([disabled]),[role="checkbox"]:not(input):not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      const isOn = el.getAttribute('aria-checked') === 'true' || el.dataset.state === 'checked';
      if (isOn) tap(el);
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  fillScope — fills all fields visible within `scope`
  // ═══════════════════════════════════════════════════════════════════════════
  const fillScope = async scope => {

    // ── Phase 1: Text / number / tel / email / textarea ─────────────────────
    const textInputs = Array.from(scope.querySelectorAll(
      'input:not([type="date"]):not([type="checkbox"]):not([type="radio"])' +
      ':not([type="file"]):not([type="hidden"]):not([type="password"])' +
      ':not([disabled]):not([readonly]),' +
      'textarea:not([disabled])'
    )).filter(el => !shouldSkip(el) && !filledEls.has(el) && isVisible(el));

    // Required fields first
    textInputs.sort((a, b) => {
      const aReq = a.required || a.getAttribute('aria-required') === 'true' ? 0 : 1;
      const bReq = b.required || b.getAttribute('aria-required') === 'true' ? 0 : 1;
      return aReq - bReq;
    });

    for (const el of textInputs) {
      const type = (el.type || 'text').toLowerCase();
      const key  = getKey(el);
      const lbl  = getLabel(el);
      const plh  = (el.placeholder || '').trim();
      let val    = null;

      if (type === 'time') {
        val = D.resolveText(key, lbl, plh, 'time');
      } else if (type === 'datetime-local') {
        const c = norm(`${key} ${lbl}`);
        const d = /birth|dob/.test(c) ? D.pastDate(22, 42) : D.futureDate(0, 180);
        val = `${d}T${D.pick([D.startTime, D.endTime])}`;
      } else if (type === 'month') {
        const d = new Date(Date.now() + D.rn(1, 180) * 86400000);
        val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      } else if (type === 'week') {
        const d   = new Date(Date.now() + D.rn(1, 90) * 86400000);
        const jan = new Date(d.getFullYear(), 0, 1);
        const wk  = Math.ceil(((d - jan) / 86400000 + jan.getDay() + 1) / 7);
        val = `${d.getFullYear()}-W${String(wk).padStart(2,'0')}`;
      } else if (type === 'number') {
        const mn = el.min !== '' ? Number(el.min) : 1;
        const mx = el.max !== '' ? Number(el.max) : 100;
        val = D.resolveText(key, lbl, plh, 'number') ?? D.rn(mn, mx);
      } else if (type === 'email') {
        val = D.resolveText(key, lbl, plh, 'email');
      } else if (type === 'tel') {
        val = D.resolveText(key, lbl, plh, 'tel');
      } else {
        // Detect custom date pickers: type="text" with placeholder like DD-MM-YYYY, MM/DD/YYYY, YYYY-MM-DD
        const up = plh.toUpperCase();
        const isDatePlh = /^[DMY]{1,4}[-\/\.][DMY]{1,2}[-\/\.][DMY]{2,4}$/.test(up);
        if (isDatePlh) {
          const sep  = up.includes('/') ? '/' : up.includes('.') ? '.' : '-';
          const c2   = norm(`${key} ${lbl}`);
          const raw  = /birth|dob|birthday/.test(c2) ? D.pastDate(22, 42)
                     : /join|start|from|begin/.test(c2) ? D.futureDate(1, 90)
                     : /confirm|end|expir|to/.test(c2)  ? D.futureDate(90, 365)
                     : D.futureDate(0, 180);
          const [yr, mo, dy] = raw.split('-');
          val = up.startsWith('Y') ? `${yr}${sep}${mo}${sep}${dy}`
              : up.startsWith('D') ? `${dy}${sep}${mo}${sep}${yr}`
              :                      `${mo}${sep}${dy}${sep}${yr}`;
        } else {
          val = D.resolveText(key, lbl, plh, type);
        }
      }

      if (val != null) {
        try {
          el.focus({ preventScroll: true });
          setVal(el, String(val));
          glow(el);
          filledEls.add(el);
          filledCount++;
        } catch (_) {}
      }
    }

    // ── Phase 2: Native <select> ─────────────────────────────────────────────
    // Works in plain HTML, Bootstrap, Tailwind, SSR forms — any framework.
    scope.querySelectorAll('select:not([disabled])').forEach(el => {
      if (filledEls.has(el) || !isVisible(el)) return;
      const opts = Array.from(el.options).filter(o => o.value && !o.disabled);
      if (!opts.length) return;

      const key   = getKey(el);
      const lbl   = getLabel(el);
      const fakeOpts = opts.map(o => ({ text: o.text, value: o.value }));
      const smart = D.resolveSelect(key, lbl, fakeOpts);
      const chosen = smart
        ? opts.find(o => o.value === smart.value || o.text === smart.text) ?? D.pick(opts)
        : D.pick(opts);

      try {
        setVal(el, chosen.value);
        glow(el, true);
        filledEls.add(el);
        filledCount++;
      } catch (_) {}
    });

    // ── Phase 3: Date inputs ─────────────────────────────────────────────────
    // Uses isInDom (not isVisible) because custom date picker components often
    // render a hidden backing input[type="date"] with zero dimensions — it must
    // still be filled via setVal so React state updates correctly.
    scope.querySelectorAll('input[type="date"]:not([disabled]):not([readonly])').forEach(el => {
      if (filledEls.has(el) || !isInDom(el)) return;
      const c = norm(`${getKey(el)} ${getLabel(el)}`);
      let date;
      if (/birth|dob|birthday/.test(c))    date = D.pastDate(22, 42);
      else if (/join|start|from|begin/.test(c)) date = D.futureDate(1, 90);
      else if (/confirm|end|expir|to/.test(c))  date = D.futureDate(90, 365);
      else                                       date = D.futureDate(0, 180);
      try {
        el.focus({ preventScroll: true });
        setVal(el, date);
        glow(el, true);
        filledEls.add(el);
        filledCount++;
      } catch (_) {}
    });

    // ── Phase 4: Radio groups ────────────────────────────────────────────────
    const radioGroups = new Map();
    scope.querySelectorAll('input[type="radio"]:not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      const groupKey =
        el.name ||
        el.closest('[role="radiogroup"]')?.id ||
        el.closest('fieldset')?.id ||
        String(Math.round(el.getBoundingClientRect().top));
      if (!radioGroups.has(groupKey)) radioGroups.set(groupKey, []);
      radioGroups.get(groupKey).push(el);
    });
    radioGroups.forEach(radios => {
      if (radios.some(r => filledEls.has(r))) return;
      const chosen = D.pick(radios);
      try {
        const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
        if (desc?.set) desc.set.call(chosen, true); else chosen.checked = true;
        chosen.dispatchEvent(new Event('change', { bubbles: true }));
        chosen.dispatchEvent(new Event('click',  { bubbles: true }));
        radios.forEach(r => filledEls.add(r));
      } catch (_) {}
    });

    // ── Phase 5: Checkboxes ──────────────────────────────────────────────────
    scope.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(el => {
      if (filledEls.has(el) || !isVisible(el)) return;
      const shouldCheck = Math.random() < 0.6;
      if (el.checked !== shouldCheck) {
        try {
          const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
          if (desc?.set) desc.set.call(el, shouldCheck); else el.checked = shouldCheck;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('click',  { bubbles: true }));
        } catch (_) {}
      }
      filledEls.add(el);
    });

    // ── Phase 6: Custom toggles — [role="switch"] / [role="checkbox"] ────────
    // Covers: Shadcn Switch, Radix Switch, Headless UI Switch, custom toggles
    scope.querySelectorAll('[role="switch"]:not([disabled]),[role="checkbox"]:not(input):not([disabled])').forEach(el => {
      if (filledEls.has(el) || !isVisible(el)) return;
      const isOn  = el.getAttribute('aria-checked') === 'true' || el.dataset.state === 'checked';
      const turnOn = Math.random() < 0.6;
      if (isOn !== turnOn) tap(el);
      filledEls.add(el);
    });

    // ── Phase 7: Custom dropdowns (Shadcn, MUI, Ant Design, Headless UI) ─────
    // Selector covers both aria-haspopup="menu" (Radix/Shadcn) and "listbox" (MUI/Ant)
    const DROPDOWN_SEL = 'button[aria-haspopup="menu"]:not([disabled]),button[aria-haspopup="listbox"]:not([disabled]),[role="combobox"]:not([disabled])';

    // Identify which triggers belong to array-field patterns (handled in Phase 8)
    const arrayTriggerSet = new Set();
    scope.querySelectorAll(DROPDOWN_SEL).forEach(trig => {
      const addBtn = Array.from(trig.parentElement?.parentElement?.children ?? []).find(c =>
        c.tagName === 'BUTTON' && c.type === 'button' && !c.getAttribute('aria-haspopup')
      );
      if (addBtn) arrayTriggerSet.add(trig);
    });

    const standaloneDropdowns = Array.from(scope.querySelectorAll(DROPDOWN_SEL))
      .filter(b => !arrayTriggerSet.has(b) && !filledEls.has(b) && isVisible(b));

    for (const trig of standaloneDropdowns) {
      const lbl = getLabel(trig);
      await fillDropdown(trig, lbl, flat => D.pick(flat));
      glow(trig, true);
      filledEls.add(trig);
      filledCount++;
    }

    // ── Phase 8: Array-field — select mode ───────────────────────────────────
    const arraySelect = [];
    scope.querySelectorAll(DROPDOWN_SEL).forEach(trig => {
      if (!arrayTriggerSet.has(trig) || filledEls.has(trig) || !isVisible(trig)) return;
      const addBtn = Array.from(trig.parentElement?.parentElement?.children ?? []).find(c =>
        c.tagName === 'BUTTON' && c.type === 'button' && !c.getAttribute('aria-haspopup')
      );
      if (addBtn) arraySelect.push({ trig, addBtn });
    });

    for (const { trig, addBtn } of arraySelect) {
      for (let i = 0; i < 2; i++) {
        if (!fillViaFiber(trig, flat => flat[0])) {
          await silentSelectFallback(trig, items => items[0] ?? null);
        }
        if (!getOverlayItems().length) break;
        await sleep(120);
        tap(addBtn);
        await sleep(100);
      }
      filledEls.add(trig);
      filledEls.add(addBtn);
    }

    // ── Cascade pass: fill selects that were disabled and became enabled ─────
    // Pattern: Country select fills → State becomes enabled → State fills →
    // City becomes enabled → City fills, etc.
    // Runs up to 5 times (handles deep chains), stops early if nothing new found.
    for (let pass = 0; pass < 5; pass++) {
      await sleep(350); // wait for React state to propagate + re-render
      let gained = 0;

      // Native selects that just became enabled
      scope.querySelectorAll('select:not([disabled])').forEach(el => {
        if (filledEls.has(el) || !isVisible(el)) return;
        const opts = Array.from(el.options).filter(o => o.value && !o.disabled);
        if (!opts.length) return;
        const key = getKey(el), lbl = getLabel(el);
        const smart = D.resolveSelect(key, lbl, opts.map(o => ({ text: o.text, value: o.value })));
        const chosen = smart
          ? opts.find(o => o.value === smart.value || o.text === smart.text) ?? D.pick(opts)
          : D.pick(opts);
        try { setVal(el, chosen.value); glow(el, true); filledEls.add(el); filledCount++; gained++; } catch (_) {}
      });

      // Custom dropdowns that just became enabled
      const freshDropdowns = Array.from(scope.querySelectorAll(DROPDOWN_SEL))
        .filter(b => !filledEls.has(b) && isVisible(b));
      for (const trig of freshDropdowns) {
        await fillDropdown(trig, getLabel(trig), flat => D.pick(flat));
        glow(trig, true);
        filledEls.add(trig);
        filledCount++;
        gained++;
      }

      // Text/number inputs that just became enabled (e.g. "Other" free-text field)
      Array.from(scope.querySelectorAll(
        'input:not([type="date"]):not([type="checkbox"]):not([type="radio"])' +
        ':not([type="file"]):not([type="hidden"]):not([type="password"])' +
        ':not([disabled]):not([readonly]),textarea:not([disabled])'
      )).filter(el => !shouldSkip(el) && !filledEls.has(el) && isVisible(el) && !el.value.trim())
      .forEach(el => {
        const type = (el.type || 'text').toLowerCase();
        const key = getKey(el), lbl = getLabel(el), plh = (el.placeholder || '').trim();
        const val = type === 'number'
          ? D.resolveText(key, lbl, plh, 'number') ?? D.rn(el.min !== '' ? Number(el.min) : 1, el.max !== '' ? Number(el.max) : 100)
          : D.resolveText(key, lbl, plh, type);
        if (val != null) {
          try { el.focus({ preventScroll: true }); setVal(el, String(val)); glow(el); filledEls.add(el); filledCount++; gained++; } catch (_) {}
        }
      });

      if (gained === 0) break; // nothing newly enabled — cascade is complete
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Main
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    // ── Scope detection ──────────────────────────────────────────────────────
    // Prefer focused dialog/sheet over full page — avoids filling hidden forms
    const scope =
      document.querySelector('[data-slot="sheet-content"]') ||
      document.querySelector('[role="dialog"]')             ||
      document.querySelector('[role="alertdialog"]')        ||
      document.querySelector('main form')                   ||
      document.querySelector('main')                        ||
      document.querySelector('form')                        ||
      document.body;

    // ── Form reset — clear existing data before filling ─────────────────────
    resetScope(scope);
    await sleep(200); // let React state propagate after reset

    // ── Tab orchestration ────────────────────────────────────────────────────
    // Fills the active tab, then each inactive tab in sequence, then returns
    // to the originally active tab. This handles multi-step / wizard forms.
    const activeTabs = Array.from(scope.querySelectorAll('[role="tab"][aria-selected="true"]:not([disabled])'));
    const otherTabs  = Array.from(scope.querySelectorAll('[role="tab"]:not([aria-selected="true"]):not([disabled])'));
    const allTabs    = [...activeTabs, ...otherTabs];

    if (allTabs.length > 1) {
      for (const tab of allTabs) {
        tap(tab);
        await sleep(TAB_WAIT_MS);
        await fillScope(scope);
        // Brief pause: lets the glow be visible on this tab before we switch.
        // Without this, the next tap() fires before glow has rendered (async paint).
        await sleep(120);
      }
      // Return to originally active tab
      if (activeTabs[0]) { tap(activeTabs[0]); await sleep(200); }
    } else {
      await fillScope(scope);
    }

    // ── Verify pass ──────────────────────────────────────────────────────────
    // React state updates are async — wait then fill anything still empty
    await sleep(VERIFY_MS);

    Array.from(scope.querySelectorAll(
      'input:not([type="date"]):not([type="checkbox"]):not([type="radio"])' +
      ':not([type="file"]):not([type="hidden"]):not([type="password"])' +
      ':not([disabled]):not([readonly]),textarea:not([disabled])'
    ))
    .filter(el => !shouldSkip(el) && isVisible(el) && !el.value.trim())
    .forEach(el => {
      const type = (el.type || 'text').toLowerCase();
      const key  = getKey(el), lbl = getLabel(el), plh = (el.placeholder || '').trim();
      let val = null;
      if (type === 'time')           val = D.resolveText(key, lbl, plh, 'time');
      else if (type === 'datetime-local') {
        const d = D.futureDate(0, 180);
        val = `${d}T${D.pick([D.startTime, D.endTime])}`;
      }
      else if (type === 'number')    { const mn = el.min!==''?Number(el.min):1, mx=el.max!==''?Number(el.max):100; val = D.resolveText(key,lbl,plh,'number') ?? D.rn(mn,mx); }
      else if (type === 'email')     val = D.resolveText(key, lbl, plh, 'email');
      else if (type === 'tel')       val = D.resolveText(key, lbl, plh, 'tel');
      else                           val = D.resolveText(key, lbl, plh, type);
      if (val != null) {
        try { el.focus({ preventScroll: true }); setVal(el, String(val)); glow(el); filledCount++; } catch (_) {}
      }
    });

    scope.querySelectorAll('input[type="date"]:not([disabled]):not([readonly])').forEach(el => {
      if (!isInDom(el) || el.value) return;
      const c = norm(`${getKey(el)} ${getLabel(el)}`);
      const d = /birth|dob/.test(c) ? D.pastDate(22,42)
              : /join|start|from/.test(c) ? D.futureDate(1,90)
              : /confirm|end|expir/.test(c) ? D.futureDate(90,365)
              : D.futureDate(0,180);
      try { el.focus({preventScroll:true}); setVal(el, d); glow(el, true); filledCount++; } catch (_) {}
    });

    showToast(filledCount);
    try { chrome.runtime.sendMessage({ type: 'COPILOTX_DONE', count: filledCount }); } catch (_) {}

  } finally {
    window.__copilotxRunning = false;
  }
})();
