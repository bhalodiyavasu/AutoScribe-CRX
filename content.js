(async () => {
  // If panel already exists, don't re-mount it, just highlight it
  if (document.getElementById('autoscribe-panel-root')) {
    const root = document.getElementById('autoscribe-panel-root');
    const panel = root.shadowRoot?.querySelector('.autoscribe-floating');
    if (panel) {
      panel.style.transform = 'scale(1.05)';
      setTimeout(() => { panel.style.transform = 'scale(1)'; }, 150);
    }
    return;
  }

  // ── Constants ──────────────────────────────────────────────────────────────
  const THEME        = '#22c55e';
  const GLOW_MS      = 1000;
  const TAB_WAIT_MS  = 500;

  // ── Utilities ─────────────────────────────────────────────────────────────
  const sleep  = ms => new Promise(r => setTimeout(r, ms));
  const norm   = s  => String(s).toLowerCase().replace(/[-_\s[\]./*:]/g,'');
  const clean  = s  => s.replace(/[*\s]+$/g, '').trim();

  // ── Label resolution ──────────────────────────────────────────────────────
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
  const isVisible = el => {
    let n = el;
    while (n && n !== document.body) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
      n = n.parentElement;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return true; // Allow elements in active animations
    return r.width > 0 || r.height > 0;
  };

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
    if (['hidden','submit','button','file','password','image','reset'].includes(t)) return true;
    const k = (el.name || el.id || el.placeholder || '').toLowerCase();
    return k.includes('search') || k.includes('filter') || (el.maxLength > 0 && el.maxLength <= 1);
  };

  // ── Visual feedback ───────────────────────────────────────────────────────
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

  const glow = (el, wrapped = false) => {
    const target = wrapped ? findVisualTarget(el) : el;
    if (!document.contains(target)) return;
    const cleanup = applyGlow(target);
    setTimeout(cleanup, GLOW_MS);
  };

  // ── Framework-agnostic value setter ───────────────────────────────────────
  const setVal = (el, val, skipBlur = false) => {
    const proto =
      el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype :
      el.tagName === 'SELECT'   ? HTMLSelectElement.prototype   :
                                  HTMLInputElement.prototype;

    const nativeSet = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    try {
      if (nativeSet) nativeSet.call(el, val); else el.value = val;
    } catch (_) { return; }

    const events = skipBlur ? ['input', 'change'] : ['input', 'change', 'blur'];
    events.forEach(type =>
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

  // ── React fiber dropdown options extractor ────────────────────────────────
  const getFiberOptions = trigger => {
    try {
      const fk = Object.keys(trigger).find(k =>
        k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
      );
      if (!fk) return null;
      let fiber = trigger[fk];
      while (fiber) {
        const mp = fiber.memoizedProps;
        if (mp?.options && Array.isArray(mp.options) && mp.options.length > 0) {
          return mp.options
            .flatMap(o => (o.data && Array.isArray(o.data)) ? o.data : [o])
            .filter(o => !o.disabled)
            .map(o => ({ text: o.label ?? String(o.value ?? o), value: o.value ?? o }));
        }
        fiber = fiber.return;
      }
    } catch (_) {}
    return null;
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

  // ── Overlay item collector ────────────────────────────────────────────────
  const getOverlayItems = () =>
    Array.from(document.querySelectorAll('[role="menuitem"],[role="option"]')).filter(el =>
      !el.hasAttribute('data-disabled') &&
      el.getAttribute('aria-disabled') !== 'true' &&
      el.textContent.trim() &&
      !/^(no data|no result|no option|no item|select|choose)/i.test(el.textContent.trim())
    );

  // ── Silent overlay fallback ────────────────────────────────────────────────
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
      tap(trigger);
    }

    await sleep(120);
    if (portal) portal.style.visibility = '';
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let filledCount = 0;
  const filledEls = new Set();
  let elIdCounter = 0;

  const getOrAssignId = el => {
    let id = el.getAttribute('data-autoscribe-id');
    if (!id) {
      id = `f_${elIdCounter++}`;
      el.setAttribute('data-autoscribe-id', id);
    }
    return id;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  resetScope — clears all existing fields before filling
  // ═══════════════════════════════════════════════════════════════════════════
  const resetScope = scope => {
    Array.from(scope.querySelectorAll(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="file"])' +
      ':not([type="hidden"]):not([type="submit"]):not([type="button"])' +
      ':not([type="image"]):not([type="reset"]):not([type="password"])' +
      ':not([disabled]):not([readonly]),' +
      'textarea:not([disabled]):not([readonly])'
    )).filter(el => !shouldSkip(el) && (isVisible(el) || isInDom(el))).forEach(el => {
      try { setVal(el, '', true); } catch (_) {}
    });

    scope.querySelectorAll('select:not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      try { if (el.options.length > 0) setVal(el, el.options[0].value, true); } catch (_) {}
    });

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

    scope.querySelectorAll('[role="switch"]:not([disabled]),[role="checkbox"]:not(input):not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      const isOn = el.getAttribute('aria-checked') === 'true' || el.dataset.state === 'checked';
      if (isOn) tap(el);
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  scanScope — discovers all fields to be filled
  // ═══════════════════════════════════════════════════════════════════════════
  const scanScope = scope => {
    const fields = [];

    // 1. Text inputs, numbers, textareas
    const textInputs = Array.from(scope.querySelectorAll(
      'input:not([type="date"]):not([type="checkbox"]):not([type="radio"])' +
      ':not([type="file"]):not([type="hidden"]):not([type="password"])' +
      ':not([disabled]):not([readonly]),textarea:not([disabled])'
    )).filter(el => !shouldSkip(el) && !filledEls.has(el) && isVisible(el));

    for (const el of textInputs) {
      const type = (el.type || 'text').toLowerCase();
      fields.push({
        id: getOrAssignId(el),
        type: type === 'textarea' ? 'textarea' : type,
        label: getLabel(el),
        placeholder: el.placeholder || '',
        name: getKey(el),
        min: el.min !== '' ? el.min : undefined,
        max: el.max !== '' ? el.max : undefined,
        required: el.required || el.getAttribute('aria-required') === 'true'
      });
    }

    // 2. Native Selects
    scope.querySelectorAll('select:not([disabled])').forEach(el => {
      if (filledEls.has(el) || !isVisible(el)) return;
      const opts = Array.from(el.options)
        .filter(o => o.value && !o.disabled)
        .map(o => ({ text: o.text, value: o.value }));

      fields.push({
        id: getOrAssignId(el),
        type: 'select',
        label: getLabel(el),
        name: getKey(el),
        options: opts,
        required: el.required || el.getAttribute('aria-required') === 'true'
      });
    });

    // 3. Date Inputs
    scope.querySelectorAll('input[type="date"]:not([disabled]):not([readonly])').forEach(el => {
      if (filledEls.has(el) || !isInDom(el)) return;
      fields.push({
        id: getOrAssignId(el),
        type: 'date',
        label: getLabel(el),
        name: getKey(el),
        required: el.required || el.getAttribute('aria-required') === 'true'
      });
    });

    // 4. Radio groups
    const radioGroups = new Map();
    scope.querySelectorAll('input[type="radio"]:not([disabled])').forEach(el => {
      if (!isVisible(el)) return;
      const groupKey = el.name || el.closest('[role="radiogroup"]')?.id || el.closest('fieldset')?.id || String(Math.round(el.getBoundingClientRect().top));
      if (!radioGroups.has(groupKey)) radioGroups.set(groupKey, []);
      radioGroups.get(groupKey).push(el);
    });

    radioGroups.forEach((radios, groupKey) => {
      if (radios.some(r => filledEls.has(r))) return;
      const first = radios[0];
      const opts = radios.map(r => ({ text: getLabel(r) || r.value || getKey(r), value: r.value || r.id }));
      const mapping = radios.map(r => ({ elId: getOrAssignId(r), value: r.value || r.id }));

      fields.push({
        id: getOrAssignId(first),
        type: 'radio-group',
        label: getLabel(first.closest('[role="radiogroup"]') || first.closest('fieldset') || first),
        name: groupKey,
        options: opts,
        radioIdMap: mapping
      });
    });

    // 5. Checkboxes
    scope.querySelectorAll('input[type="checkbox"]:not([disabled])').forEach(el => {
      if (filledEls.has(el) || !isVisible(el)) return;
      fields.push({
        id: getOrAssignId(el),
        type: 'checkbox',
        label: getLabel(el),
        name: getKey(el),
        required: el.required || el.getAttribute('aria-required') === 'true'
      });
    });

    // 6. Custom toggles
    scope.querySelectorAll('[role="switch"]:not([disabled]),[role="checkbox"]:not(input):not([disabled])').forEach(el => {
      if (filledEls.has(el) || !isVisible(el)) return;
      fields.push({
        id: getOrAssignId(el),
        type: 'toggle',
        label: getLabel(el),
        name: getKey(el)
      });
    });

    // 7. Custom Dropdowns
    const DROPDOWN_SEL = 'button[aria-haspopup="menu"]:not([disabled]),button[aria-haspopup="listbox"]:not([disabled]),[role="combobox"]:not([disabled])';
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
      const opts = getFiberOptions(trig);
      fields.push({
        id: getOrAssignId(trig),
        type: 'custom-dropdown',
        label: getLabel(trig),
        name: getKey(trig),
        options: opts
      });
    }

    return fields;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  Indian Client-side Smart Data Generator (Loads from modular window.AUTOSCRIBE_DATA)
  // ═══════════════════════════════════════════════════════════════════════════
  const generateLocalData = field => {
    const data = window.AUTOSCRIBE_DATA;
    if (!data) return "Active";

    const l = field.label || '';
    const n = field.name || '';
    const p = field.placeholder || '';
    const t = field.type || 'text';

    if (t === 'select' || t === 'custom-dropdown') {
      const opts = field.options || [];
      const resolved = data.resolveSelect(n, l, opts);
      if (resolved) return resolved.value ?? resolved;
      if (opts.length > 0) return opts[Math.floor(Math.random() * opts.length)].value;
      return "Active";
    }

    if (t === 'date') {
      const isPast = /birth|dob|dateofbirth/i.test(`${n} ${l} ${p}`);
      return isPast ? data.pastDate(20, 50) : data.futureDate(1, 90);
    }

    if (t === 'number') {
      const min = field.min !== undefined ? Number(field.min) : 1;
      const max = field.max !== undefined ? Number(field.max) : 100;
      return String(data.rn(min, max));
    }

    // Resolve using data.js rules
    const resolved = data.resolveText(n, l, p, t);
    if (resolved !== null && resolved !== undefined) return resolved;

    // Fallback default
    return "Active";
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  fillFormWithData — fills target elements with supplied/calculated values
  // ═══════════════════════════════════════════════════════════════════════════
  const fillFormWithData = async (scope, fields, values, mode = 'AI') => {
    const allInputs = Array.from(scope.querySelectorAll(
      'input:not([type="file"]):not([type="hidden"]):not([type="password"]):not([disabled]):not([readonly]),' +
      'textarea:not([disabled]), select:not([disabled]), [role="switch"]:not([disabled]),' +
      '[role="checkbox"]:not(input):not([disabled]), button[aria-haspopup="menu"]:not([disabled]),' +
      'button[aria-haspopup="listbox"]:not([disabled]), [role="combobox"]:not([disabled])'
    ));

    for (const f of fields) {
      if (!document.getElementById('autoscribe-panel-root')) return;
      let val = values[f.id];

      // If AI mode and AI failed to return value, fallback to normal local generator
      if ((val === undefined || val === null || val === '') && mode === 'AI') {
        val = generateLocalData(f);
      } else if (mode === 'NORMAL') {
        val = generateLocalData(f);
      }

      if (val === undefined || val === null) continue;

      // Resilient DOM selection with double fallback matching
      let el = scope.querySelector(`[data-autoscribe-id="${f.id}"]`);
      if (!el) {
        el = allInputs.find(item => {
          if (shouldSkip(item)) return false;
          const key = getKey(item);
          const lbl = getLabel(item);
          return (f.name && key && norm(key) === norm(f.name)) ||
                 (f.label && lbl && norm(lbl) === norm(f.label)) ||
                 (f.placeholder && item.placeholder && norm(item.placeholder) === norm(f.placeholder));
        });
      }

      if (!el || filledEls.has(el)) continue;

      try {
        if (f.type === 'select') {
          const chosen = Array.from(el.options).find(o => norm(o.value) === norm(val) || norm(o.text) === norm(val)) || el.options[0];
          setVal(el, chosen.value);
          glow(el, true);
        } else if (f.type === 'checkbox') {
          const shouldCheck = val === true || val === 'true';
          if (el.checked !== shouldCheck) {
            const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
            if (desc?.set) desc.set.call(el, shouldCheck); else el.checked = shouldCheck;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('click',  { bubbles: true }));
          }
        } else if (f.type === 'toggle') {
          const shouldBeOn = val === true || val === 'true';
          const isOn = el.getAttribute('aria-checked') === 'true' || el.dataset.state === 'checked';
          if (isOn !== shouldBeOn) tap(el);
        } else if (f.type === 'radio-group') {
          const groupKey = f.name;
          const radios = allInputs.filter(r => r.type === 'radio' && (r.name === groupKey || r.closest('[role="radiogroup"]')?.id === groupKey || r.closest('fieldset')?.id === groupKey));
          const targetRadio = radios.find(r => norm(r.value) === norm(val) || norm(r.id) === norm(val) || norm(getLabel(r)) === norm(val));
          if (targetRadio) {
            const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
            if (desc?.set) desc.set.call(targetRadio, true); else targetRadio.checked = true;
            targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
            targetRadio.dispatchEvent(new Event('click',  { bubbles: true }));
            radios.forEach(r => filledEls.add(r));
          }
        } else if (f.type === 'custom-dropdown') {
          const fiberFilled = fillViaFiber(el, flat => {
            return flat.find(o => norm(o.label ?? String(o.value ?? o)) === norm(val) || norm(o.value ?? o) === norm(val)) ?? flat[0];
          });
          if (!fiberFilled) {
            await silentSelectFallback(el, items => {
              if (!items.length) return null;
              return items.find(i => norm(i.textContent.trim()) === norm(val) || norm(i.getAttribute('data-value')) === norm(val)) ?? items[0];
            });
          }
          glow(el, true);
        } else {
          el.focus({ preventScroll: true });
          setVal(el, String(val));
          glow(el, f.type === 'date');
        }

        filledEls.add(el);
        filledCount++;
      } catch (e) {
        console.warn(`[AutoScribe] Failed to fill field:`, e);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  UI Mount: Scoped Floating Obsidian Draggable Card
  // ═══════════════════════════════════════════════════════════════════════════
  const mountPopup = async () => {
    const root = document.createElement('div');
    root.id = 'autoscribe-panel-root';
    root.style.position = 'fixed';
    root.style.top = '40px';
    root.style.right = '40px';
    root.style.zIndex = '2147483647';
    document.body.appendChild(root);

    // Stop all event propagation from the shadow host to the main page to prevent bleeding click actions
    ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'keypress', 'contextmenu', 'dblclick'].forEach(evtType => {
      root.addEventListener(evtType, e => {
        e.stopPropagation();
      });
    });

    const shadow = root.attachShadow({ mode: 'open' });

    // Load glassmorphic styles from modular popup.css
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('popup.css');
    shadow.appendChild(link);

    const container = document.createElement('div');
    container.className = 'autoscribe-floating';

    // Crucial: Stop click event bleeding into host webpage
    ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'keypress'].forEach(evtType => {
      container.addEventListener(evtType, e => {
        e.stopPropagation();
        // Prevent default on pointerdown/mousedown to keep focus on the host page inputs and prevent blur validations
        if (['mousedown', 'pointerdown'].includes(evtType)) {
          e.preventDefault();
        }
      });
    });

    // Load separate HTML structure dynamically
    const htmlUrl = chrome.runtime.getURL('popup.html');
    const htmlRes = await fetch(htmlUrl);
    const htmlContent = await htmlRes.text();
    container.innerHTML = htmlContent;

    shadow.appendChild(container);

    // Resolve extension logo URL dynamically
    shadow.getElementById('crx-logo-img').src = chrome.runtime.getURL('icons/icon.png');

    // ── Drag & Drop Handlers (Pointer Capture & Viewport Clamping) ──────────
    const handle = shadow.getElementById('crx-drag-handle');
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener('pointerdown', e => {
      isDragging = true;
      offsetX = e.clientX - root.offsetLeft;
      offsetY = e.clientY - root.offsetTop;
      handle.setPointerCapture(e.pointerId);
      e.stopPropagation();
      e.preventDefault();
    });

    handle.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const rect = root.getBoundingClientRect();
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;

      // Keep within viewport boundaries
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;

      if (newLeft < 0) newLeft = 0;
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop < 0) newTop = 0;
      if (newTop > maxTop) newTop = maxTop;

      root.style.left = `${newLeft}px`;
      root.style.top = `${newTop}px`;
      root.style.right = 'auto';
      e.stopPropagation();
    });

    const stopDragging = e => {
      if (isDragging) {
        isDragging = false;
        try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    handle.addEventListener('pointerup', stopDragging);
    handle.addEventListener('pointercancel', stopDragging);

    // ── Close button ────────────────────────────────────────────────────────
    shadow.getElementById('crx-close-btn').addEventListener('click', e => {
      root.remove();
      e.stopPropagation();
    });

    // ── Action Buttons ──────────────────────────────────────────────────────
    const btnAI     = shadow.getElementById('crx-btn-ai');
    const btnNormal = shadow.getElementById('crx-btn-normal');
    const status    = shadow.getElementById('crx-status-text');

    const disableRows = () => {
      btnAI.style.pointerEvents = 'none';
      btnAI.style.opacity = '0.5';
      btnNormal.style.pointerEvents = 'none';
      btnNormal.style.opacity = '0.5';
    };
    const enableRows = () => {
      btnAI.style.pointerEvents = '';
      btnAI.style.opacity = '';
      btnNormal.style.pointerEvents = '';
      btnNormal.style.opacity = '';
    };

    const executeFillFlow = async (mode) => {
      disableRows();
      filledCount = 0;
      filledEls.clear();

      if (mode === 'AI') {
        container.classList.add('crx-loading-ai');
      } else {
        container.classList.add('crx-loading-quick');
      }

      try {
        const scope =
          document.querySelector('[data-slot="sheet-content"]') ||
          document.querySelector('[role="dialog"]')             ||
          document.querySelector('[role="alertdialog"]')        ||
          document.querySelector('main form')                   ||
          document.querySelector('main')                        ||
          document.querySelector('form')                        ||
          document.body;

        if (!document.getElementById('autoscribe-panel-root')) return;
        status.className = 'crx-status crx-status-running';
        status.innerHTML = `<span class="crx-spinner"></span> Cleansed form...`;
        resetScope(scope);
        await sleep(300);

        if (!document.getElementById('autoscribe-panel-root')) return;
        const activeTabs = Array.from(scope.querySelectorAll('[role="tab"][aria-selected="true"]:not([disabled])'));
        const otherTabs  = Array.from(scope.querySelectorAll('[role="tab"]:not([aria-selected="true"]):not([disabled])'));
        const allTabs    = [...activeTabs, ...otherTabs];

        if (mode === 'AI') {
          status.className = 'crx-status crx-status-running';
          status.innerHTML = `<span class="crx-spinner"></span> Scanning inputs...`;
          if (allTabs.length > 1) {
            for (const tab of allTabs) {
              if (!document.getElementById('autoscribe-panel-root')) return;
              tap(tab);
              await sleep(TAB_WAIT_MS);
              if (!document.getElementById('autoscribe-panel-root')) return;
              status.className = 'crx-status crx-status-running';
              status.innerHTML = `<span class="crx-spinner"></span> AI Generating...`;
              const fields = scanScope(scope);
              if (fields.length > 0) {
                const res = await new Promise(resolve => {
                  chrome.runtime.sendMessage({ type: 'FILL_WITH_AI', fields }, resolve);
                });
                if (!document.getElementById('autoscribe-panel-root')) return;
                if (res?.error) throw new Error(res.error);
                await fillFormWithData(scope, fields, res?.values || {}, 'AI');
              }
              await sleep(150);
            }
            if (!document.getElementById('autoscribe-panel-root')) return;
            if (activeTabs[0]) { tap(activeTabs[0]); await sleep(200); }
          } else {
            if (!document.getElementById('autoscribe-panel-root')) return;
            status.className = 'crx-status crx-status-running';
            status.innerHTML = `<span class="crx-spinner"></span> AI Generating...`;
            const fields = scanScope(scope);
            if (fields.length > 0) {
              const res = await new Promise(resolve => {
                chrome.runtime.sendMessage({ type: 'FILL_WITH_AI', fields }, resolve);
              });
              if (!document.getElementById('autoscribe-panel-root')) return;
              if (res?.error) throw new Error(res.error);
              await fillFormWithData(scope, fields, res?.values || {}, 'AI');
            }
          }
          if (!document.getElementById('autoscribe-panel-root')) return;
          status.className = 'crx-status crx-status-success';
          status.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M20 6 9 17l-5-5"/></svg>${filledCount} fields filled`;
        } else {
          if (!document.getElementById('autoscribe-panel-root')) return;
          status.className = 'crx-status crx-status-running';
          status.innerHTML = `<span class="crx-spinner"></span> Quick Generating...`;
          if (allTabs.length > 1) {
            for (const tab of allTabs) {
              if (!document.getElementById('autoscribe-panel-root')) return;
              tap(tab);
              await sleep(TAB_WAIT_MS);
              if (!document.getElementById('autoscribe-panel-root')) return;
              const fields = scanScope(scope);
              if (fields.length > 0) {
                await fillFormWithData(scope, fields, {}, 'NORMAL');
              }
              await sleep(150);
            }
            if (!document.getElementById('autoscribe-panel-root')) return;
            if (activeTabs[0]) { tap(activeTabs[0]); await sleep(200); }
          } else {
            if (!document.getElementById('autoscribe-panel-root')) return;
            await sleep(600);
            if (!document.getElementById('autoscribe-panel-root')) return;
            const fields = scanScope(scope);
            if (fields.length > 0) {
              await fillFormWithData(scope, fields, {}, 'NORMAL');
            }
          }
          if (!document.getElementById('autoscribe-panel-root')) return;
          status.className = 'crx-status crx-status-success';
          status.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M20 6 9 17l-5-5"/></svg>${filledCount} fields filled`;
        }

        if (!document.getElementById('autoscribe-panel-root')) return;
        setTimeout(() => {
          if (!document.getElementById('autoscribe-panel-root')) return;
          if (status.innerHTML.includes('filled')) {
            status.innerHTML = '';
            status.className = 'crx-status';
          }
        }, 3000);


      } catch (err) {
        if (!document.getElementById('autoscribe-panel-root')) return;
        console.error('[AutoScribe]', err);
        status.className = 'crx-status crx-status-error';
        status.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:3px"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>${err.message || 'Something went wrong'}`;
      } finally {
        if (document.getElementById('autoscribe-panel-root')) {
          container.classList.remove('crx-loading-ai', 'crx-loading-quick');
          enableRows();
        }
      }
    };

    btnAI.addEventListener('click', e => {
      e.stopPropagation();
      executeFillFlow('AI');
    });
    btnNormal.addEventListener('click', e => {
      e.stopPropagation();
      executeFillFlow('NORMAL');
    });
  };

  await mountPopup();
})();
