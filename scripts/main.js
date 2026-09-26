/**
 * VALENCE AI - Core Interactive Engine
 * Powers Neural Hero Canvas, Product Simulators, Theme Toggles & Demos
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbar();
  initHeroCanvas();
  initClassModeSimulator();
  initEpochFormsSimulator();
  initGeminiMeshSimulator();
  initCodeTabs();
  initPricingToggle();
  initContactModal();
  initSmoothScroll();
});

/* ===================================================================
   1. THEME SWITCHER (Dark / Light)
   =================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const storedTheme = localStorage.getItem('valence-theme') || 'dark';

  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const target = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
      localStorage.setItem('valence-theme', target);
      updateThemeIcon(target);

      // Notify canvas to adjust particle colors
      if (window.updateCanvasTheme) {
        window.updateCanvasTheme(target);
      }
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeToggleIcon');
  if (!icon) return;
  if (theme === 'light') {
    // Moon icon for switching to dark
    icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
  } else {
    // Sun icon for switching to light
    icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
  }
}

/* ===================================================================
   2. NAVBAR & MOBILE MENU
   =================================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'var(--bg-surface)';
        navLinks.style.padding = '1.5rem';
        navLinks.style.borderBottom = '1px solid var(--border-medium)';
      }
    });
  }
}

/* ===================================================================
   3. NEURAL HERO CANVAS VISUALIZER
   =================================================================== */
function initHeroCanvas() {
  const canvas = document.getElementById('neuralHeroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animationFrameId;

  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  let mouse = { x: width / 2, y: height / 2, isHovered: false };

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
    repositionMasterNodes();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isHovered = true;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.isHovered = false;
  });

  // 3 Primary Brand Nodes
  const masterNodes = [
    {
      id: 'class',
      name: 'Class Mode',
      color: '#10B981',
      lightColor: '#059669',
      x: width * 0.24,
      y: height * 0.35,
      radius: 14,
      pulse: 0,
      role: 'Adaptive Tutoring'
    },
    {
      id: 'epoch',
      name: 'Epoch Forms',
      color: '#06B6D4',
      lightColor: '#0891B2',
      x: width * 0.76,
      y: height * 0.35,
      radius: 14,
      pulse: 1.2,
      role: 'Vision Auto-Fill'
    },
    {
      id: 'mesh',
      name: 'Gemini Mesh',
      color: '#8B5CF6',
      lightColor: '#7C3AED',
      x: width * 0.5,
      y: height * 0.72,
      radius: 16,
      pulse: 2.4,
      role: 'Agent Mesh'
    }
  ];

  function repositionMasterNodes() {
    masterNodes[0].x = width * 0.24;
    masterNodes[0].y = height * 0.35;
    masterNodes[1].x = width * 0.76;
    masterNodes[1].y = height * 0.35;
    masterNodes[2].x = width * 0.5;
    masterNodes[2].y = height * 0.72;
  }

  // Floating background neurons
  const particleCount = 38;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2.5 + 1.5,
      opacity: Math.random() * 0.5 + 0.25
    });
  }

  // Floating data packets travelling along primary chords
  const packets = [
    { from: 0, to: 2, progress: 0, speed: 0.008, color: '#10B981' },
    { from: 1, to: 2, progress: 0.5, speed: 0.007, color: '#06B6D4' },
    { from: 2, to: 0, progress: 0.2, speed: 0.009, color: '#8B5CF6' },
    { from: 2, to: 1, progress: 0.7, speed: 0.008, color: '#8B5CF6' },
    { from: 0, to: 1, progress: 0.4, speed: 0.006, color: '#6366F1' }
  ];

  function render() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.clearRect(0, 0, width, height);

    // Subtle background mesh grid
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Connect floating particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Mouse gravity
      if (mouse.isHovered) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          p.x += (dx / dist) * 0.4;
          p.y += (dy / dist) * 0.4;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? `rgba(15, 23, 42, ${p.opacity * 0.5})` : `rgba(255, 255, 255, ${p.opacity * 0.7})`;
      ctx.fill();

      // Inter-particle links
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 75) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = isLight
            ? `rgba(79, 70, 229, ${(1 - dist / 75) * 0.12})`
            : `rgba(99, 102, 241, ${(1 - dist / 75) * 0.18})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw primary neural links between master nodes
    for (let i = 0; i < masterNodes.length; i++) {
      for (let j = i + 1; j < masterNodes.length; j++) {
        const n1 = masterNodes[i];
        const n2 = masterNodes[j];

        // Gradient line
        const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
        grad.addColorStop(0, isLight ? n1.lightColor : n1.color);
        grad.addColorStop(1, isLight ? n2.lightColor : n2.color);

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.globalAlpha = isLight ? 0.35 : 0.45;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    // Render data packets flowing on chords
    packets.forEach((pkt) => {
      pkt.progress += pkt.speed;
      if (pkt.progress > 1) pkt.progress = 0;

      const fromNode = masterNodes[pkt.from];
      const toNode = masterNodes[pkt.to];
      const px = fromNode.x + (toNode.x - fromNode.x) * pkt.progress;
      const py = fromNode.y + (toNode.y - fromNode.y) * pkt.progress;

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = pkt.color;
      ctx.shadowColor = pkt.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render master product nodes
    masterNodes.forEach((node) => {
      node.pulse += 0.04;
      const pulseRadius = node.radius + Math.sin(node.pulse) * 4;
      const nodeColor = isLight ? node.lightColor : node.color;

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = nodeColor;
      ctx.globalAlpha = 0.25 + Math.sin(node.pulse) * 0.15;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Inner solid core
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label under node
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isLight ? '#0F172A' : '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + node.radius + 18);

      ctx.font = '400 10px "JetBrains Mono", monospace';
      ctx.fillStyle = isLight ? '#64748B' : '#94A3B8';
      ctx.fillText(node.role, node.x, node.y + node.radius + 32);
    });

    animationFrameId = requestAnimationFrame(render);
  }

  render();
  window.updateCanvasTheme = () => {};
}

/* ===================================================================
   4. CLASS MODE INTERACTIVE SIMULATOR
   =================================================================== */
const classModeScenarios = {
  calculus: {
    topic: 'Calculus: Chain Rule & Rates',
    tutorMsg: 'Let’s test your conceptual intuition on rate composition before we advance to multi-variable differentiation.',
    question: 'If water is pumped into a conical tank at 3 m³/min, what happens to the rate of rise (dh/dt) as water depth increases?',
    options: [
      { text: 'A) dh/dt increases because total volume expands', correct: false, reason: 'Since radius r increases with depth, horizontal surface area expands with h². A constant inflow volume results in a slower rise.' },
      { text: 'B) dh/dt decreases because cross-sectional area increases quadratically', correct: true, reason: 'Exactly right! Inflow dV/dt = A(h)·dh/dt. Since A(h) = πr² and r ∝ h, A(h) grows quadratically, forcing dh/dt to decelerate.' },
      { text: 'C) dh/dt remains constant throughout the vessel', correct: false, reason: 'Only cylindrical vessels have constant cross-sectional area. In a cone, geometry causes the rise rate to vary.' }
    ],
    initialMastery: 84
  },
  biochem: {
    topic: 'Cell Biology: Synaptic Plasticity',
    tutorMsg: 'Observing your rapid progress on neurotransmission. Let’s evaluate long-term potentiation (LTP).',
    question: 'Which receptor acts as the primary molecular coincidence detector during NMDA-dependent LTP induction?',
    options: [
      { text: 'A) AMPA receptor (voltage-gated sodium influx)', correct: false, reason: 'AMPA provides the initial depolarization required to expel the Mg²⁺ block, but NMDA itself acts as the coincidence detector.' },
      { text: 'B) NMDA receptor (permeable to Ca²⁺ upon depolarization & glutamate binding)', correct: true, reason: 'Precise! NMDA requires simultaneous glutamate binding AND postsynaptic depolarization to relieve the magnesium pore block.' },
      { text: 'C) GABA-A receptor (chloride channel)', correct: false, reason: 'GABA-A is an inhibitory receptor causing hyperpolarization, which actively suppresses LTP induction.' }
    ],
    initialMastery: 78
  },
  python: {
    topic: 'Systems: Asyncio Event Loop',
    tutorMsg: 'Great code submissions on async handlers. Let’s check how you debug blocking calls.',
    question: 'What occurs if you execute time.sleep(5) inside an async coroutine instead of await asyncio.sleep(5)?',
    options: [
      { text: 'A) The event loop immediately spawns a background OS thread', correct: false, reason: 'time.sleep() is a synchronous C-level sleep; asyncio does not intercept it automatically unless run_in_executor is used.' },
      { text: 'B) It freezes the entire single-threaded event loop, stalling all concurrent tasks', correct: true, reason: 'Spot on! Standard time.sleep() blocks the OS thread executing the event loop, preventing all other scheduled tasks from running.' },
      { text: 'C) Python raises an unhandled CoroutineTimeout exception', correct: false, reason: 'No exception is raised; execution simply halts synchronously for 5 seconds.' }
    ],
    initialMastery: 88
  }
};

function initClassModeSimulator() {
  const tabs = document.querySelectorAll('.sim-subject-btn');
  const tutorText = document.getElementById('tutorSimText');
  const questionText = document.getElementById('simQuestionText');
  const optionsContainer = document.getElementById('simOptionsContainer');
  const feedbackCard = document.getElementById('simFeedbackCard');
  const masteryFill = document.getElementById('masteryProgressFill');
  const masteryVal = document.getElementById('masteryProgressVal');

  let currentKey = 'calculus';

  function loadScenario(key) {
    currentKey = key;
    const data = classModeScenarios[key];
    if (!data) return;

    if (tutorText) tutorText.textContent = `"${data.tutorMsg}"`;
    if (questionText) questionText.textContent = data.question;
    if (feedbackCard) {
      feedbackCard.className = 'sim-feedback-card';
      feedbackCard.textContent = '';
      feedbackCard.style.display = 'none';
    }

    if (masteryFill) masteryFill.style.width = `${data.initialMastery}%`;
    if (masteryVal) masteryVal.textContent = `${data.initialMastery}%`;

    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      data.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'sim-option-btn';
        btn.innerHTML = `<span class="option-marker">${String.fromCharCode(65 + idx)}</span> <span>${opt.text}</span>`;
        btn.addEventListener('click', () => handleOptionClick(opt, btn, data));
        optionsContainer.appendChild(btn);
      });
    }
  }

  function handleOptionClick(opt, btn, data) {
    const allBtns = optionsContainer.querySelectorAll('.sim-option-btn');
    allBtns.forEach((b) => b.classList.remove('correct', 'incorrect'));

    if (opt.correct) {
      btn.classList.add('correct');
      feedbackCard.className = 'sim-feedback-card feedback-success show';
      feedbackCard.innerHTML = `<strong>Adaptive Diagnosis:</strong> ${opt.reason}`;
      const newScore = Math.min(100, data.initialMastery + 8);
      if (masteryFill) masteryFill.style.width = `${newScore}%`;
      if (masteryVal) masteryVal.textContent = `${newScore}% (Mastered)`;
    } else {
      btn.classList.add('incorrect');
      feedbackCard.className = 'sim-feedback-card feedback-retry show';
      feedbackCard.innerHTML = `<strong>Diagnostic Hint:</strong> ${opt.reason}`;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      loadScenario(tab.dataset.subject);
    });
  });

  loadScenario('calculus');
}

/* ===================================================================
   5. EPOCH FORMS INTERACTIVE SIMULATOR
   =================================================================== */
const formScenarios = {
  w4: {
    docName: 'IRS_Form_W4_2026.pdf',
    fields: [
      { label: 'First Name & Middle Initial', val: 'Sarah M.', conf: '99.9%' },
      { label: 'Last Name', val: 'Vanderbilt', conf: '99.8%' },
      { label: 'Social Security Number', val: '•••-••-8492', conf: '100%' },
      { label: 'Filing Status', val: 'Single or Head of Household', conf: '99.7%' },
      { label: 'Step 3: Qualifying Dependents', val: '$2,000 (1 Child)', conf: '99.4%' },
      { label: 'Signature & Digital Seal', val: 'Authenticated Vault Key', conf: '100%' }
    ]
  },
  clinical: {
    docName: 'Clinical_Patient_Intake_HIPAA.pdf',
    fields: [
      { label: 'Patient Full Name', val: 'Marcus Aurelius Chen', conf: '99.9%' },
      { label: 'Date of Birth', val: '1988-11-14', conf: '100%' },
      { label: 'Primary Insurance ID', val: 'BCBS-TX-994102', conf: '99.8%' },
      { label: 'Known Drug Allergies', val: 'Penicillin, Sulfa', conf: '99.5%' },
      { label: 'Emergency Contact & Phone', val: 'Elena Chen (+1 512-555-0192)', conf: '99.6%' }
    ]
  },
  vendor: {
    docName: 'Enterprise_Master_Service_KYC.pdf',
    fields: [
      { label: 'Legal Entity Name', val: 'Synthetix Global Corp', conf: '100%' },
      { label: 'Federal Tax ID (EIN)', val: '84-9218491', conf: '99.9%' },
      { label: 'Jurisdiction of Inc.', val: 'Delaware, USA', conf: '99.8%' },
      { label: 'Governing Law', val: 'State of California', conf: '99.7%' },
      { label: 'Authorized Signatory', val: 'VP of Global Procurement', conf: '99.9%' }
    ]
  }
};

function initEpochFormsSimulator() {
  const triggerBtn = document.getElementById('runEpochSimBtn');
  const docTypeSelect = document.getElementById('epochDocSelect');
  const fieldsContainer = document.getElementById('epochFieldsContainer');
  const fileNameDisplay = document.getElementById('epochDocFileName');
  const boundingBoxes = document.querySelectorAll('.doc-bounding-box');

  let currentKey = 'w4';

  function renderFields(key, animate = false) {
    currentKey = key;
    const data = formScenarios[key];
    if (!data || !fieldsContainer) return;

    if (fileNameDisplay) fileNameDisplay.textContent = data.docName;
    fieldsContainer.innerHTML = '';

    data.fields.forEach((f, idx) => {
      const row = document.createElement('div');
      row.className = 'field-row';
      if (!animate) row.classList.add('filled');

      row.innerHTML = `
        <div class="field-meta">
          <span class="field-label">${f.label}</span>
          <span class="field-val">${animate ? 'Extracting...' : f.val}</span>
        </div>
        <div class="field-status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>${animate ? '--' : f.conf}</span>
        </div>
      `;
      fieldsContainer.appendChild(row);

      if (animate) {
        setTimeout(() => {
          row.classList.add('filled');
          row.querySelector('.field-val').textContent = f.val;
          row.querySelector('.field-status span').textContent = f.conf;
        }, (idx + 1) * 180);
      }
    });
  }

  if (docTypeSelect) {
    docTypeSelect.addEventListener('change', (e) => {
      renderFields(e.target.value, false);
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      triggerBtn.disabled = true;
      triggerBtn.innerHTML = `<svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg> Parsing Document...`;

      boundingBoxes.forEach((b) => b.classList.add('active'));

      renderFields(currentKey, true);

      setTimeout(() => {
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 100% Extracted (142ms)`;
        setTimeout(() => {
          triggerBtn.innerHTML = `Simulate Extraction`;
          boundingBoxes.forEach((b) => b.classList.remove('active'));
        }, 3000);
      }, formScenarios[currentKey].fields.length * 200 + 400);
    });
  }

  renderFields('w4', false);
}

/* ===================================================================
   6. GEMINI MESH MULTI-AGENT PIPELINE SIMULATOR
   =================================================================== */
function initGeminiMeshSimulator() {
  const runBtn = document.getElementById('runMeshSimBtn');
  const consoleBox = document.getElementById('meshConsoleLogs');
  const agentNodes = document.querySelectorAll('.agent-node');

  const steps = [
    {
      agentIndex: 0,
      tag: '[PLANNER]',
      msg: 'Deconstructed prompt into 4-stage Directed Acyclic Graph (DAG). Assigned safety boundaries.'
    },
    {
      agentIndex: 1,
      tag: '[RESEARCH]',
      msg: 'Queried private VPC telemetry. Retrieved 42 encrypted records via zero-retention sandbox.'
    },
    {
      agentIndex: 2,
      tag: '[SYNTHESIS]',
      msg: 'Formulated cross-agent consensus vector. High confidence index: 0.994.'
    },
    {
      agentIndex: 3,
      tag: '[SAFETY-AUDIT]',
      msg: 'Deterministic verification pass: PII sanitization 100%, Guardrail jailbreak check: PASSED.'
    },
    {
      agentIndex: 4,
      tag: '[EXECUTION]',
      msg: 'Emitted cryptographic audit signature: 0x9f81a... Complete pipeline latency: 284ms.'
    }
  ];

  if (!runBtn || !consoleBox) return;

  function getTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  }

  function appendLog(tag, msg, isHighlight = false) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${isHighlight ? 'highlight' : ''}`;
    entry.innerHTML = `
      <span class="log-time">${getTime()}</span>
      <span class="log-tag">${tag}</span>
      <span class="log-msg">${msg}</span>
    `;
    consoleBox.appendChild(entry);
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  runBtn.addEventListener('click', () => {
    runBtn.disabled = true;
    runBtn.innerHTML = `Executing Orchestration DAG...`;
    consoleBox.innerHTML = '';
    agentNodes.forEach((n) => n.classList.remove('active'));

    appendLog('[MESH-CONTROLLER]', 'Initiating consensus pipeline across 5 agent nodes...', true);

    steps.forEach((step, i) => {
      setTimeout(() => {
        agentNodes.forEach((n) => n.classList.remove('active'));
        if (agentNodes[step.agentIndex]) {
          agentNodes[step.agentIndex].classList.add('active');
        }
        appendLog(step.tag, step.msg, i === steps.length - 1);

        if (i === steps.length - 1) {
          setTimeout(() => {
            runBtn.disabled = false;
            runBtn.innerHTML = `Run Multi-Agent Task`;
          }, 1000);
        }
      }, (i + 1) * 700);
    });
  });
}

/* ===================================================================
   7. DEVELOPER API CODE TABS
   =================================================================== */
const codeSnippets = {
  python: `# pip install valence-mesh
import asyncio
from valence import MeshEngine, AgentGuard

async def main():
    mesh = MeshEngine(
        api_key="vm_live_0849204918a",
        cluster="us-east-enterprise-01"
    )

    # Instantiate coordinated multi-agent workflow
    workflow = mesh.create_workflow(
        name="quarterly_audit",
        guardrails=AgentGuard(pii_masking=True, human_approval="high_risk")
    )

    result = await workflow.run({
        "objective": "Reconcile Q3 balance sheet anomalies against ledger",
        "agents": ["forensics", "synthesis", "compliance_verifier"]
    })

    print(f"Consensus Audit ID: {result.execution_signature}")
    print(f"Latency: {result.telemetry.total_ms}ms")

asyncio.run(main())`,

  typescript: `// npm install @valence-ai/mesh
import { MeshEngine, AgentGuard } from '@valence-ai/mesh';

const mesh = new MeshEngine({
  apiKey: process.env.VALENCE_API_KEY!,
  endpoint: 'https://api.valence.ai/v1'
});

async function runAudit() {
  const session = await mesh.createSession({
    orchestration: 'dag_consensus',
    guardrails: new AgentGuard({
      zeroRetention: true,
      maxAutonomousSpendUSD: 25.00
    })
  });

  const response = await session.executeTask({
    agents: ['researcher', 'synthesizer', 'auditor'],
    payload: { query: 'Analyze SOC2 continuous compliance matrix' }
  });

  console.log('Execution Signature:', response.cryptoAuditHash);
}`,

  curl: `curl -X POST https://api.valence.ai/v1/mesh/execute \\
  -H "Authorization: Bearer vm_live_0849204918a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topology": "dag_consensus",
    "objective": "Autonomous cross-silo data pipeline verification",
    "guardrails": {
      "zero_retention": true,
      "max_runtime_sec": 30
    },
    "agents": ["ingest", "validator", "auditor"]
  }'`
};

function initCodeTabs() {
  const tabs = document.querySelectorAll('.code-tab-btn');
  const codeBody = document.getElementById('apiCodeDisplay');
  const copyBtn = document.getElementById('copyCodeBtn');

  let currentLang = 'python';

  function displayCode(lang) {
    currentLang = lang;
    if (!codeBody) return;
    codeBody.textContent = codeSnippets[lang] || '';
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      displayCode(tab.dataset.lang);
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = codeSnippets[currentLang] || '';
      navigator.clipboard.writeText(code).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });
  }

  displayCode('python');
}

/* ===================================================================
   8. PRICING BILLING CYCLE TOGGLE
   =================================================================== */
function initPricingToggle() {
  const toggle = document.getElementById('pricingCycleToggle');
  const prices = document.querySelectorAll('.plan-price');
  const cycleLabels = document.querySelectorAll('.billing-cycle-label');

  if (!toggle) return;

  let isAnnual = false;

  toggle.addEventListener('click', () => {
    isAnnual = !isAnnual;
    toggle.classList.toggle('annual', isAnnual);

    cycleLabels.forEach((lbl) => {
      lbl.classList.toggle('active', (lbl.dataset.cycle === 'annual') === isAnnual);
    });

    prices.forEach((priceEl) => {
      const monthlyPrice = parseInt(priceEl.dataset.monthly, 10);
      if (isNaN(monthlyPrice)) return;

      if (isAnnual) {
        // 20% discount on annual
        const annualMonthlyRate = Math.round(monthlyPrice * 0.8);
        priceEl.textContent = `${annualMonthlyRate}`;
      } else {
        priceEl.textContent = `${monthlyPrice}`;
      }
    });
  });
}

/* ===================================================================
   9. UNIFIED ACCESS / DEMO MODAL
   =================================================================== */
function initContactModal() {
  const modal = document.getElementById('contactModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const openTriggers = document.querySelectorAll('[data-open-modal]');
  const form = document.getElementById('contactRequestForm');
  const successScreen = document.getElementById('modalSuccessScreen');

  function openModal(defaultProduct) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (defaultProduct) {
      const cb = modal.querySelector(`input[name="product"][value="${defaultProduct}"]`);
      if (cb) cb.checked = true;
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (form) {
        form.reset();
        form.style.display = 'block';
      }
      if (successScreen) {
        successScreen.style.display = 'none';
      }
    }, 300);
  }

  openTriggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.openModal);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Allocating Sandbox Key...';
      }

      setTimeout(() => {
        form.style.display = 'none';
        if (successScreen) successScreen.style.display = 'block';
      }, 900);
    });
  }
}

/* ===================================================================
   10. SMOOTH SCROLL & ACTIVE SECTION SPY
   =================================================================== */
function initSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollY = window.pageYOffset;

    sections.forEach((sec) => {
      const secTop = sec.offsetTop - 120;
      const secHeight = sec.offsetHeight;
      if (scrollY >= secTop && scrollY < secTop + secHeight) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  });
}
