/**
 * AutoScribe — Krisper-specific mock data and form-filling orchestration
 */
window.KRISPER_DATA = (() => {
  // ── Helper functions for random selection ─────────────────────────────────
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const rn = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const digs = n => Array.from({ length: n }, () => rn(0, 9)).join('');

  // ── Dynamic Getters for Static Data (stored in data.js) ───────────────────
  const getStaticData = () => window.AUTOSCRIBE_DATA || {};
  const getFirstNames = () => getStaticData().firstNames || [];
  const getLastNames = () => getStaticData().lastNames || [];
  const getServices = () => getStaticData().krisperServices || [];
  const getShops = () => getStaticData().krisperShops || [];
  const getOffers = () => getStaticData().krisperOffers || [];
  const getDescriptions = () => getStaticData().krisperDescriptions || [];
  const getOptions = () => getStaticData().krisperOptions || [];

  let currentIdentity = {};

  const regenerateIdentity = () => {
    const fName = pick(getFirstNames());
    const lName = pick(getLastNames());
    currentIdentity = {
      firstName: fName,
      lastName: lName,
      fullName: `${fName} ${lName}`,
      phone: pick(['6','7','8','9']) + digs(9), // Exact 10 digits
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${rn(1, 99)}@gmail.com`,
      zip: pick(['380001', '380006', '395001', '390001', '360001', '400001', '560001', '110001']),
      address: `${rn(1, 400)}, ${pick(['MG Road', 'SG Highway', 'C.G. Road', 'Satellite Road'])}, Near Main Market, Ahmedabad - ${pick(['380015', '380009'])}`,
      shopCode: `SHP${digs(3)}`,
      referralCode: `KRP${rn(10, 99)}`
    };
  };

  // Run on load
  regenerateIdentity();

  // Normalize helper to match text inputs
  const norm = s => String(s).toLowerCase().replace(/[-_\s[\]./*:]/g, '');

  const isKrisper = () => {
    if (document.title.toLowerCase().includes('krisper')) return true;
    if (window.location.href.includes('localhost:') || window.location.href.includes('127.0.0.1')) {
      if (document.querySelector('a[href*="/business/"]') || 
          document.querySelector('a[href*="/auth/"]') ||
          document.querySelector('main') ||
          document.querySelector('.sidebar') ||
          document.querySelector('[data-slot="sheet-content"]')) {
        return true;
      }
    }
    return false;
  };

  // Custom text field resolver
  const resolveText = (key, label, placeholder, type) => {
    const combined = norm(`${key} ${label} ${placeholder}`);

    // Check specific first/last name keys first to avoid matching generic 'name' rules
    if (combined.includes('firstname') || combined.includes('fname')) return currentIdentity.firstName;
    if (combined.includes('lastname') || combined.includes('lname') || combined.includes('surname')) return currentIdentity.lastName;

    if (combined.includes('shopname')) return pick(getShops());
    if (combined.includes('servicename')) return pick(getServices());
    if (combined.includes('offername')) return pick(getOffers());
    if (combined.includes('shopcode')) return currentIdentity.shopCode;
    if (combined.includes('referralcode')) return currentIdentity.referralCode;
    
    if (combined.includes('phone') || combined.includes('mobile')) {
      return currentIdentity.phone;
    }
    
    if (combined.includes('email')) return currentIdentity.email;
    if (combined.includes('fullname') || combined.includes('customername') || (combined.includes('name') && !combined.includes('option'))) {
      return currentIdentity.fullName;
    }

    if (combined.includes('zip') || combined.includes('postal') || combined.includes('pincode')) {
      return currentIdentity.zip;
    }

    if (combined.includes('address')) return currentIdentity.address;
    if (combined.includes('description') || combined.includes('desc')) return pick(getDescriptions());

    if (type === 'number') {
      if (combined.includes('totalseats') || combined.includes('seats')) return String(rn(4, 12));
      if (combined.includes('duration')) return String(pick([30, 45, 60, 90]));
      if (combined.includes('offerprice')) return String(rn(200, 400));
      if (combined.includes('price')) return String(rn(450, 800));
      if (combined.includes('discountval')) return String(rn(10, 50));
      if (combined.includes('maxdiscount') || combined.includes('cap')) return String(rn(100, 250));
      if (combined.includes('minorder') || combined.includes('minbill')) return String(rn(499, 999));
      if (combined.includes('amount')) return String(rn(300, 600));
      if (combined.includes('maxredemption')) return '1';
    }

    if (type === 'time') {
      if (combined.includes('start')) return '09:00';
      if (combined.includes('end')) return '21:00';
    }

    return null;
  };

  // Custom select field resolver
  const resolveSelect = (key, label, opts) => {
    const combined = norm(`${key} ${label}`);
    
    if (combined.includes('status')) {
      // Prefer Active
      const act = opts.find(o => norm(o.text || o.label || o).includes('active'));
      if (act) return act.value ?? act;
    }

    if (combined.includes('country')) {
      const ind = opts.find(o => norm(o.text || o.label || o).includes('india'));
      if (ind) return ind.value ?? ind;
    }

    if (combined.includes('state')) {
      const guj = opts.find(o => norm(o.text || o.label || o).includes('gujarat'));
      if (guj) return guj.value ?? guj;
    }

    if (combined.includes('city')) {
      const ahm = opts.find(o => norm(o.text || o.label || o).includes('ahmedabad'));
      if (ahm) return ahm.value ?? ahm;
    }

    if (combined.includes('discounttype')) {
      const pct = opts.find(o => norm(o.text || o.label || o).includes('percentage'));
      if (pct) return pct.value ?? pct;
    }

    if (combined.includes('paymenttype')) {
      const cash = opts.find(o => norm(o.text || o.label || o).includes('cash') || norm(o.text || o.label || o).includes('upi'));
      if (cash) return cash.value ?? cash;
    }

    if (combined.includes('transactiontype')) {
      const debit = opts.find(o => norm(o.text || o.label || o).includes('debit'));
      if (debit) return debit.value ?? debit;
    }

    return null;
  };

  // Main wrapper for field generation
  const resolveField = field => {
    const l = field.label || '';
    const n = field.name || '';
    const p = field.placeholder || '';
    const t = field.type || 'text';

    if (t === 'select' || t === 'custom-dropdown') {
      const opts = field.options || [];
      const resolved = resolveSelect(n, l, opts);
      if (resolved !== null) return resolved;
      if (opts.length > 0) return opts[0].value ?? opts[0];
      return null;
    }

    return resolveText(n, l, p, t);
  };

  // Helper: Find ArrayInputField container and fill it by clicking Plus
  const handleArrayInputFields = async (scope, tap, setVal, getFiberOptions, fillViaFiber, sleep) => {
    // ArrayInputField rendered contains a button with icon size="icon" or Plus icon, and input / trigger dropdown
    const arrayContainers = Array.from(scope.querySelectorAll('.space-y-1')).filter(container => {
      return container.querySelector('button[size="icon"]') || 
             container.querySelector('svg.lucide-plus') ||
             (container.querySelector('button') && container.querySelector('button').innerHTML.includes('Plus'));
    });

    for (const container of arrayContainers) {
      // Find the add/plus button
      const plusBtn = container.querySelector('button[size="icon"]') || 
                      container.querySelector('button') ||
                      Array.from(container.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-plus'));
      if (!plusBtn) continue;

      // Check if it has a custom select trigger inside
      const trigger = container.querySelector('button[aria-haspopup="menu"]');
      if (trigger) {
        // It's a SelectInput inside ArrayInputField! (e.g. Applicable Services)
        // Select 1 option
        const opts = getFiberOptions(trigger);
        if (opts && opts.length > 0) {
          const opt = opts[0]; // pick first service
          const filled = fillViaFiber(trigger, () => opt);
          if (filled) {
            await sleep(100);
            tap(plusBtn);
            await sleep(250);
          }
        }
      } else {
        // It's a text input! (e.g. Options list in Service Form)
        const input = container.querySelector('input');
        if (input) {
          const val = resolveText('optionName', 'Options', '', 'text') || pick(getOptions());
          setVal(input, val);
          await sleep(100);
          tap(plusBtn);
          await sleep(250);
        }
      }
    }
  };

  // Orchestrated multi-step filling logic for Krisper
  const fillForm = async ({
    scope,
    mode,
    scanScope,
    fillFormWithData,
    resetScope,
    sleep,
    glow,
    setVal,
    tap,
    getFiberOptions,
    fillViaFiber,
    fillWithAIStream,
    multiTabEnabled
  }) => {
    let fillError = null;
    regenerateIdentity();

    // Helper to run Verify Slots workflow
    const fillAppointmentWorkflow = async (scopeToFill, modeToFill) => {
      // 1. Scan the initial booking details (Shop, Services, Date)
      const initialFields = scanScope(scopeToFill);
      
      if (!document.getElementById('autoscribe-panel-root')) return;

      if (modeToFill === 'AI') {
        // Stream AI directly
        await fillWithAIStream(scopeToFill, initialFields);
        await sleep(150);
      } else {
        // NORMAL mode: Fill with static defaults
        let initialValues = {};
        for (const f of initialFields) {
          initialValues[f.id] = resolveField(f);
        }
        await fillFormWithData(scopeToFill, initialFields, initialValues, modeToFill);
        await sleep(150);
      }
      if (!document.getElementById('autoscribe-panel-root')) return;

      // Fill the ArrayInputField services specifically
      await handleArrayInputFields(scopeToFill, tap, setVal, getFiberOptions, fillViaFiber, sleep);
      await sleep(200);
      if (!document.getElementById('autoscribe-panel-root')) return;

      // 2. Click "Verify Slots"
      const currentVerifyBtn = Array.from(scopeToFill.querySelectorAll('button')).find(b => 
        b.textContent.includes('Verify Slots')
      );
      if (currentVerifyBtn) {
        tap(currentVerifyBtn);
        await sleep(1500); // Wait for slots to fetch and become verified
      }
      if (!document.getElementById('autoscribe-panel-root')) return;

      // 3. Scan the newly enabled fields (Customer, Time slot, Offer)
      const secondaryFields = scanScope(scopeToFill);

      if (modeToFill === 'AI') {
        // Stream AI directly
        await fillWithAIStream(scopeToFill, secondaryFields);
      } else {
        // NORMAL mode: Fill with static defaults
        let secondaryValues = {};
        for (const f of secondaryFields) {
          secondaryValues[f.id] = resolveField(f);
        }
        await fillFormWithData(scopeToFill, secondaryFields, secondaryValues, modeToFill);
      }
    };

    // Helper to fill a single standard tab/scope
    const fillSingleScope = async (scopeToFill, modeToFill) => {
      if (!document.getElementById('autoscribe-panel-root')) return;
      await handleArrayInputFields(scopeToFill, tap, setVal, getFiberOptions, fillViaFiber, sleep);
      await sleep(150);
      if (!document.getElementById('autoscribe-panel-root')) return;

      const fields = scanScope(scopeToFill);
      if (fields.length === 0) return;

      if (modeToFill === 'AI') {
        // Stream AI directly
        await fillWithAIStream(scopeToFill, fields);
      } else {
        // NORMAL mode: Fill with static defaults
        let values = {};
        for (const f of fields) {
          values[f.id] = resolveField(f);
        }
        await fillFormWithData(scopeToFill, fields, values, modeToFill);
      }
    };

    // 1. Reset Form
    resetScope(scope);
    await sleep(200);
    if (!document.getElementById('autoscribe-panel-root')) return;

    // 2. Tab detection
    const activeTabs = Array.from(scope.querySelectorAll('[role="tab"][aria-selected="true"]:not([disabled])'));
    const otherTabs  = Array.from(scope.querySelectorAll('[role="tab"]:not([aria-selected="true"]):not([disabled])'));
    const allTabs    = [...activeTabs, ...otherTabs];

    if (multiTabEnabled && allTabs.length > 1) {
      // Switch through tabs to fill all of them
      for (const tab of allTabs) {
        if (!document.getElementById('autoscribe-panel-root')) return;
        tap(tab);
        await sleep(500); // Allow tab to switch and load content
        if (!document.getElementById('autoscribe-panel-root')) return;
        
        const verifyBtn = Array.from(scope.querySelectorAll('button')).find(b => 
          b.textContent.includes('Verify Slots') || b.textContent.includes('Verified')
        );

        if (verifyBtn) {
          await fillAppointmentWorkflow(scope, mode);
        } else {
          await fillSingleScope(scope, mode);
        }
        await sleep(150);
      }
      // Return to original active tab
      if (activeTabs[0]) {
        if (!document.getElementById('autoscribe-panel-root')) return;
        tap(activeTabs[0]);
        await sleep(200);
      }
    } else {
      // Single/No tabs
      const verifyBtn = Array.from(scope.querySelectorAll('button')).find(b => 
        b.textContent.includes('Verify Slots') || b.textContent.includes('Verified')
      );

      if (verifyBtn) {
        await fillAppointmentWorkflow(scope, mode);
      } else {
        await fillSingleScope(scope, mode);
      }
    }

    if (fillError) {
      throw fillError;
    }
  };

  return {
    isKrisper,
    resolveField,
    resolveText,
    resolveSelect,
    fillForm,
    regenerateIdentity
  };
})();
