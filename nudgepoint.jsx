// ============================================================================
// NUDGEPOINT — Contemporary Gallery & Exhibition Aesthetic
// Inspired by High-Contrast Editorial Typography, Architectural Grids, & Pastel Auras
// ============================================================================

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ----------------------------------------------------------------------------
// 1. RESTRAINED ACOUSTIC SYNTHESIS (Web Audio API)
// ----------------------------------------------------------------------------
class MinimalAcousticEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastAlertMs = 0;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPulseChime() {
    if (this.muted) return;
    const now = Date.now();
    if (now - this.lastAlertMs < 25000) return;
    this.lastAlertMs = now;

    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [587.33, 880.0].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.08);

        const start = t + i * 0.08;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch (e) {}
  }

  playTap() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  playResolve() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.07);
        const s = t + i * 0.07;
        gain.gain.setValueAtTime(0.01, s);
        gain.gain.linearRampToValueAtTime(0.1, s + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, s + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(s);
        osc.stop(s + 0.5);
      });
    } catch (e) {}
  }
}

const acoustic = new MinimalAcousticEngine();

// ----------------------------------------------------------------------------
// 2. PEDAGOGICAL CONSTANTS
// ----------------------------------------------------------------------------
const FRICTION_TAGS = [
  { id: 'step', label: 'Step Transition', desc: 'Lost between line 2 and line 3' },
  { id: 'pace', label: 'Pacing Too Fast', desc: 'Need 30 seconds to catch up notes' },
  { id: 'example', label: 'Concrete Example', desc: 'Abstract theorem needs real values' },
  { id: 'notation', label: 'Notation Ambiguity', desc: 'Clarify symbol or operator' },
  { id: 'unclear', label: 'Visual Unclear', desc: 'Chalk glare or microphone audio' },
];

const LECTURE_MILESTONES = [
  { id: 'm1', title: '1. Review: Slope & Tangent Lines', timestamp: '00:00' },
  { id: 'm2', title: '2. Formal Definition of the Derivative', timestamp: '07:15' },
  { id: 'm3', title: '3. Step 3: Algebraic Conjugate Substitution', timestamp: '18:40' },
  { id: 'm4', title: '4. Chain Rule with Trigonometric Functions', timestamp: '31:20' },
  { id: 'm5', title: '5. Real-World Velocity Application', timestamp: '42:10' },
];

const PEDAGOGICAL_BRIDGES = {
  step: [
    {
      title: "The Algebraic Replay",
      script: "Let’s pause right here. Before we proceed to line 4, let’s do a 30-second replay of the exact algebraic trick connecting line 2 to line 3.",
      rationale: "Addresses intermediate logic freeze without requiring students to identify themselves."
    },
    {
      title: "Show of Pens Check",
      script: "Quick check: on this transition, how many see where the negative sign factored out? Let me write out the common denominator explicitly on the board.",
      rationale: "Normalizes the question by assuming the instructor skipped an implicit step."
    }
  ],
  pace: [
    {
      title: "The 30-Second Silent Sync",
      script: "I covered that quickly. Let’s take 30 seconds of quiet time. Catch up on your notes, put your pens down when ready, and then we’ll move forward.",
      rationale: "Gives working memory time to consolidate without breaking lecture dignity."
    }
  ],
  example: [
    {
      title: "The 1D Numerical Anchor",
      script: "Before we continue in abstract n-dimensions, let’s plug in x = 2 and observe how the terms behave numerically.",
      rationale: "Provides tangible grounding for abstract mathematical notation."
    }
  ],
  notation: [
    {
      title: "Symbol Deconstruction",
      script: "To clarify terminology: notice that 'd' here acts as a differential operator, not an algebraic variable you can factor out.",
      rationale: "Removes symbolic ambiguity."
    }
  ],
  general: [
    {
      title: "Alternative Perspective",
      script: "Let’s look at this same theorem from another angle. Imagine viewing this curve as a cross-section rather than a projection.",
      rationale: "Provides dual-coding mental representation."
    }
  ]
};

const SOCRATIC_BREAKDOWNS = {
  '3. Step 3: Algebraic Conjugate Substitution': {
    analogy: "Conjugate multiplication is like multiplying by 1. The value remains unchanged, but the radical moves from denominator to numerator.",
    microStep: "Line 2.5: Multiply numerator & denominator by [√(x+h) + √x]. The top expands to [(x+h) - x] = h. Then h in the numerator cancels with h in denominator.",
    boundaryCheck: "If h = 0 before canceling, the expression yields 0/0 (indeterminate). After cancellation, setting h = 0 cleanly gives 1 / (2√x)."
  },
  'default': {
    analogy: "Deconstruct the principle into an input driver and an output response.",
    microStep: "Explicitly write out the identity or substitution connecting line A to line B on the chalkboard.",
    boundaryCheck: "Evaluate the equation at x = 0 and x → ∞ to verify asymptotic behavior."
  }
};

const LECTURE_ROWS = [
  { id: 'rowA', name: 'Row A • Front Row Focus', desc: 'Direct chalkboard sightline; active attention and high conceptual retention' },
  { id: 'rowB', name: 'Row B • Active Learners', desc: 'Engaged pacing; balances derivation notes with conceptual flow' },
  { id: 'rowC', name: 'Row C • Chalkboard Transcribers', desc: 'Fast note-copiers highly vulnerable to slide transitions and skipped micro-steps' },
  { id: 'rowD', name: 'Row D • Middle Stagger', desc: 'Mixed cohort; cognitive load accumulates quickly during dense algebraic expansion' },
  { id: 'rowE', name: 'Row E • The Silent Corner', desc: 'Shy strugglers suffering in silence; 0% hand-raise probability when lost' },
];

const SIMULATION_ROSTER = [
  // ROW A: Front Row Focus (Attentive)
  { id: 's3', name: 'Devon Miller', role: 'Attentive', rowId: 'rowA', seat: 'A1', initials: 'DM', thought: 'Lim h→0 makes clear geometric sense as the secant becomes tangent.' },
  { id: 's4', name: 'Aaliyah Patel', role: 'Attentive', rowId: 'rowA', seat: 'A2', initials: 'AP', thought: 'Solid algebraic transition, following every term in step 3.' },
  { id: 's7', name: 'Kai Takahashi', role: 'Attentive', rowId: 'rowA', seat: 'A3', initials: 'KT', thought: 'The difference quotient expands cleanly here.' },
  { id: 's8', name: 'Maya Lin', role: 'Attentive', rowId: 'rowA', seat: 'A4', initials: 'ML', thought: 'Graphing the tangent slope helps verify the formula.' },
  { id: 's19', name: 'Benjamin Lee', role: 'Attentive', rowId: 'rowA', seat: 'A5', initials: 'BL', thought: 'Standard conjugate trick applied directly to square roots.' },
  { id: 's24', name: 'Grace Hall', role: 'Attentive', rowId: 'rowA', seat: 'A6', initials: 'GH', thought: 'Numerator simplifies nicely after algebraic expansion.' },
  { id: 's25', name: 'Daniel Lewis', role: 'Attentive', rowId: 'rowA', seat: 'A7', initials: 'DL', thought: 'Clear line-by-line derivation, ready for the chain rule.' },

  // ROW B: Active Learners
  { id: 's11', name: 'Noah Kim', role: 'Attentive', rowId: 'rowB', seat: 'B1', initials: 'NK', thought: 'Good pace, can see how the numerator terms cancel.' },
  { id: 's12', name: 'Emma Davis', role: 'Attentive', rowId: 'rowB', seat: 'B2', initials: 'ED', thought: 'Step 2 conjugate multiplication is a classic textbook move.' },
  { id: 's21', name: 'James Wilson', role: 'Attentive', rowId: 'rowB', seat: 'B3', initials: 'JW', thought: 'Double checking the negative sign on the second term.' },
  { id: 's23', name: 'Alexander White', role: 'Attentive', rowId: 'rowB', seat: 'B4', initials: 'AW', thought: 'Taking notes on the conjugate expansion on chalkboard.' },
  { id: 's29', name: 'Matthew Green', role: 'Attentive', rowId: 'rowB', seat: 'B5', initials: 'MG', thought: 'Following along with the algebraic factoring.' },
  { id: 's30', name: 'Victoria Baker', role: 'Attentive', rowId: 'rowB', seat: 'B6', initials: 'VB', thought: 'Noticed the h in denominator stays factored out until cancel.' },
  { id: 's32', name: 'Abigail Moore', role: 'Attentive', rowId: 'rowB', seat: 'B7', initials: 'AM', thought: 'Ready for the limit substitution once h drops out.' },

  // ROW C: Chalkboard Transcribers (Note Copiers)
  { id: 's2', name: 'Elena Rostova', role: 'Note Copier', rowId: 'rowC', seat: 'C1', initials: 'ER', thought: 'Writing so fast! Missed how line 2 converted into line 3.' },
  { id: 's6', name: 'Sofia Garcia', role: 'Note Copier', rowId: 'rowC', seat: 'C2', initials: 'SG', thought: 'Slide flipped before I finished copying equation 2!' },
  { id: 's10', name: 'Zoe Washington', role: 'Note Copier', rowId: 'rowC', seat: 'C3', initials: 'ZW', thought: 'Lost in the radical notation while trying to copy accurately.' },
  { id: 's14', name: 'Hannah Wright', role: 'Note Copier', rowId: 'rowC', seat: 'C4', initials: 'HW', thought: 'Need 30 seconds of quiet sync to finish writing line 2 notes!' },
  { id: 's20', name: 'Mia Robinson', role: 'Note Copier', rowId: 'rowC', seat: 'C5', initials: 'MR', thought: 'My eyes left the board for 5 seconds and now I’m completely lost.' },
  { id: 's26', name: 'Amelia Young', role: 'Note Copier', rowId: 'rowC', seat: 'C6', initials: 'AY', thought: 'Working memory overloaded trying to transcribe chalkboard verbatim.' },
  { id: 's31', name: 'Sebastian Hill', role: 'Note Copier', rowId: 'rowC', seat: 'C7', initials: 'SH', thought: 'Can’t write and comprehend at the same time at this lecture speed.' },

  // ROW D: Middle Stagger (Mixed)
  { id: 's15', name: 'Julian Bell', role: 'Attentive', rowId: 'rowD', seat: 'D1', initials: 'JB', thought: 'Following okay, but the algebra is getting algebraically dense.' },
  { id: 's16', name: 'Olivia Martinez', role: 'Attentive', rowId: 'rowD', seat: 'D2', initials: 'OM', thought: 'The common denominator manipulation is slightly tricky here.' },
  { id: 's17', name: 'Ethan Taylor', role: 'Attentive', rowId: 'rowD', seat: 'D3', initials: 'ET', thought: 'Watching carefully where the radical distributes in line 3.' },
  { id: 's27', name: 'Henry King', role: 'Attentive', rowId: 'rowD', seat: 'D4', initials: 'HK', thought: 'Looks correct, just verifying boundary conditions as h→0.' },
  { id: 's34', name: 'Emily Perez', role: 'Attentive', rowId: 'rowD', seat: 'D5', initials: 'EP', thought: 'Understanding the concept, recording the key intermediate step.' },
  { id: 's35', name: 'David Thompson', role: 'Attentive', rowId: 'rowD', seat: 'D6', initials: 'DT', thought: 'All terms accounted for so far in the expansion.' },
  { id: 's13', name: 'Aiden Smith', role: 'Shy', rowId: 'rowD', seat: 'D7', initials: 'AS', thought: 'Hesitant on how the radicals multiplied out. Sinking in my seat.' },

  // ROW E: The Silent Corner (Shy Strugglers)
  { id: 's1', name: 'Marcus Chen', role: 'Shy', rowId: 'rowE', seat: 'E1', initials: 'MC', thought: 'How did line 2 cancel into line 3? Too scared to raise hand.' },
  { id: 's18', name: 'Chloe Adams', role: 'Shy', rowId: 'rowE', seat: 'E2', initials: 'CA', thought: 'Did we assume x > 0 here? I don’t want to look stupid asking.' },
  { id: 's5', name: 'Liam O’Connor', role: 'Shy', rowId: 'rowE', seat: 'E3', initials: 'LO', thought: 'Completely lost after the conjugate step. Afraid to interrupt.' },
  { id: 's9', name: 'Lucas Scott', role: 'Shy', rowId: 'rowE', seat: 'E4', initials: 'LS', thought: 'Felt friction 3 minutes ago, now just copying symbols mindlessly.' },
  { id: 's22', name: 'Harper Clark', role: 'Shy', rowId: 'rowE', seat: 'E5', initials: 'HC', thought: 'Everyone else seems to understand, so I’ll deliberately stay silent.' },
  { id: 's28', name: 'Isabella Scott', role: 'Shy', rowId: 'rowE', seat: 'E6', initials: 'IS', thought: 'Lost track of where h vanished in the fraction. Staring at board.' },
  { id: 's33', name: 'Samuel Jackson', role: 'Shy', rowId: 'rowE', seat: 'E7', initials: 'SJ', thought: 'Need a concrete numerical example, abstract algebra is blinding.' },
];

function getOrCreateStudentToken() {
  let id = localStorage.getItem('np_gallery_token');
  if (!id) {
    id = 'g_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('np_gallery_token', id);
  }
  return id;
}

// ----------------------------------------------------------------------------
// 3. MAIN APPLICATION ROOT
// ----------------------------------------------------------------------------
function NudgePointApp() {
  const parseRoute = () => {
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    let view = 'studio';
    let code = 'CALC';
    if (params.get('view')) view = params.get('view');
    else if (hash.includes('student')) view = 'student';
    else if (hash.includes('podium')) view = 'podium';
    else if (hash.includes('stage')) view = 'stage';
    else if (hash.includes('analytics')) view = 'analytics';

    if (params.get('room')) code = params.get('room').toUpperCase();
    return { view, code };
  };

  const initial = useMemo(parseRoute, []);
  const [activeView, setActiveView] = useState(initial.view);
  const [roomCode, setRoomCode] = useState(initial.code);

  useEffect(() => {
    const onHash = () => {
      const { view, code } = parseRoute();
      if (view) setActiveView(view);
      if (code) setRoomCode(code);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [courseName] = useState('MATH 201: Multivariable Calculus');
  const [activeTopic, setActiveTopic] = useState('3. Step 3: Algebraic Conjugate Substitution');
  const [topics] = useState(LECTURE_MILESTONES);
  const [windowDurationSec] = useState(90);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showFlightSim, setShowFlightSim] = useState(true);

  const [students] = useState(SIMULATION_ROSTER);
  const [pulses, setPulses] = useState([
    { id: 'p1', studentId: 's1', timestamp: Date.now() - 35000, tag: 'step', topic: '3. Step 3: Algebraic Conjugate Substitution' },
    { id: 'p2', studentId: 's2', timestamp: Date.now() - 30000, tag: 'step', topic: '3. Step 3: Algebraic Conjugate Substitution' },
    { id: 'p3', studentId: 's5', timestamp: Date.now() - 22000, tag: 'pace', topic: '3. Step 3: Algebraic Conjugate Substitution' },
    { id: 'p4', studentId: 's9', timestamp: Date.now() - 14000, tag: 'step', topic: '3. Step 3: Algebraic Conjugate Substitution' },
    { id: 'p5', studentId: 's13', timestamp: Date.now() - 6000, tag: 'example', topic: '3. Step 3: Algebraic Conjugate Substitution' },
    { id: 'p6', studentId: 's18', timestamp: Date.now() - 2000, tag: 'step', topic: '3. Step 3: Algebraic Conjugate Substitution' },
  ]);

  const [questions, setQuestions] = useState([
    { id: 'q1', text: 'Where did the common denominator (x+h) cancel out?', upvotes: 8, timestamp: Date.now() - 120000, answered: false, projected: true },
    { id: 'q2', text: 'Are we evaluating h from the right or two-sided limit?', upvotes: 3, timestamp: Date.now() - 50000, answered: false, projected: false },
  ]);

  const [interventions, setInterventions] = useState([
    { id: 'i1', title: 'The 30-Second Silent Sync', timestamp: Date.now() - 12 * 60 * 1000, topic: '2. Formal Definition of the Derivative' }
  ]);

  const [studentToken] = useState(() => {
    try {
      const hash = window.location.hash || '';
      if (hash.includes('view=student')) {
        return getOrCreateStudentToken();
      }
    } catch (e) {}
    return 's1';
  });

  const [studentNotes, setStudentNotes] = useState([
    { time: '10:18', topic: '2. Formal Definition of the Derivative', tag: 'Pacing Too Fast' }
  ]);

  // Priority 1 & 3: Multi-device WebSocket Transport and Teacher PIN state
  const [teacherPin, setTeacherPin] = useState(() => {
    try { return localStorage.getItem('np_teacher_pin') || '8492'; } catch (e) { return '8492'; }
  });
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(() => {
    try { return !!localStorage.getItem('np_teacher_pin'); } catch (e) { return false; }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [serverNotice, setServerNotice] = useState(null);

  const wsRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isMounted = true;

    function initSocket() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        const wsUrl = `${protocol}//${host}:8765`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setSocketConnected(true);
          ws.send(JSON.stringify({
            type: 'JOIN',
            room: roomCode,
            role: activeView === 'podium' ? 'podium' : 'student',
            pin: teacherPin,
            studentId: studentToken
          }));
        };

        ws.onmessage = (e) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'INIT_STATE' && msg.data) {
              if (Array.isArray(msg.data.pulses)) setPulses(msg.data.pulses);
              if (Array.isArray(msg.data.questions)) setQuestions(msg.data.questions);
              if (Array.isArray(msg.data.interventions)) setInterventions(msg.data.interventions);
              if (msg.data.activeTopic) setActiveTopic(msg.data.activeTopic);
            } else if (msg.type === 'PULSE') {
              setPulses((prev) => {
                if (prev.some((p) => p.id === msg.data.id)) return prev;
                return [...prev, msg.data];
              });
            } else if (msg.type === 'RESOLVE') {
              setPulses((prev) => prev.filter((p) => p.studentId !== msg.data.studentId));
            } else if (msg.type === 'QUESTION') {
              setQuestions((prev) => {
                if (prev.some((q) => q.id === msg.data.id)) return prev;
                return [msg.data, ...prev];
              });
            } else if (msg.type === 'UPVOTE') {
              setQuestions((prev) => prev.map((q) => q.id === msg.data.id ? { ...q, upvotes: q.upvotes + 1 } : q));
            } else if (msg.type === 'PROJECT_QUESTION') {
              setQuestions((prev) => prev.map((q) => q.id === msg.data.id ? { ...q, projected: msg.data.projected } : q));
            } else if (msg.type === 'TOPIC') {
              setActiveTopic(msg.data);
            } else if (msg.type === 'INTERVENTION') {
              setInterventions((prev) => [msg.data, ...prev]);
            } else if (msg.type === 'RATE_LIMIT' || msg.type === 'MODERATION_BLOCKED') {
              setServerNotice(msg.message);
              setTimeout(() => { if (isMounted) setServerNotice(null); }, 4500);
            } else if (msg.type === 'AUTH_ERROR') {
              setIsTeacherAuthenticated(false);
              setPinError(msg.message);
            }
          } catch (parseErr) {}
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setSocketConnected(false);
          reconnectTimeout = setTimeout(initSocket, 2500);
        };

        ws.onerror = () => {
          try { ws.close(); } catch (err) {}
        };

        wsRef.current = ws;
      } catch (err) {
        reconnectTimeout = setTimeout(initSocket, 3000);
      }
    }

    initSocket();

    // BroadcastChannel backup for same-browser offline tab sync
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        channelRef.current = new BroadcastChannel('nudgepoint_gallery_sync');
        channelRef.current.onmessage = (e) => {
          const { type, data } = e.data || {};
          if (type === 'PULSE') setPulses((prev) => prev.some((p) => p.id === data.id) ? prev : [...prev, data]);
          else if (type === 'RESOLVE') setPulses((prev) => prev.filter((p) => p.studentId !== data.studentId));
          else if (type === 'QUESTION') setQuestions((prev) => prev.some((q) => q.id === data.id) ? prev : [data, ...prev]);
          else if (type === 'UPVOTE') setQuestions((prev) => prev.map((q) => q.id === data.id ? { ...q, upvotes: q.upvotes + 1 } : q));
          else if (type === 'TOPIC') setActiveTopic(data);
        };
      }
    } catch (e) {}

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
      if (channelRef.current) {
        try { channelRef.current.close(); } catch (e) {}
      }
    };
  }, [roomCode, teacherPin, activeView]);

  const broadcast = (type, data) => {
    // 1. WebSocket send to server (multi-device real-time relay)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type, room: roomCode, data }));
      } catch (e) {}
    }
    // 2. BroadcastChannel for instant same-browser reflection
    if (channelRef.current) {
      try { channelRef.current.postMessage({ type, data }); } catch (e) {}
    }
  };

  const handleVerifyTeacherPin = (e) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) {
      setPinError('Please enter the 4-digit teacher passkey.');
      return;
    }
    if (pin === teacherPin || pin === '8492') {
      try { localStorage.setItem('np_teacher_pin', pin); } catch (err) {}
      setTeacherPin(pin);
      setIsTeacherAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Invalid Teacher PIN. (Default Room CALC PIN is 8492)');
    }
  };

  const handleLogoutTeacher = () => {
    try { localStorage.removeItem('np_teacher_pin'); } catch (e) {}
    setIsTeacherAuthenticated(false);
    setPinInput('');
  };

  useEffect(() => {
    acoustic.muted = !soundEnabled;
  }, [soundEnabled]);

  const now = Date.now();
  const windowCutoff = now - windowDurationSec * 1000;
  const activePulses = useMemo(() => pulses.filter((p) => p.timestamp >= windowCutoff), [pulses, windowCutoff]);

  const activeStudentPulse = useMemo(() => {
    return activePulses.find((p) => p.studentId === studentToken) || null;
  }, [activePulses, studentToken]);

  const activeStudentIds = useMemo(() => {
    const s = new Set();
    activePulses.forEach((p) => s.add(p.studentId));
    return s;
  }, [activePulses]);

  // Dynamic census: Base 35-seat lecture hall roster plus any external live connected devices
  const externalStudentIds = useMemo(() => {
    const rosterSet = new Set(students.map((s) => s.id));
    const externals = new Set();
    activePulses.forEach((p) => {
      if (!rosterSet.has(p.studentId)) externals.add(p.studentId);
    });
    return externals;
  }, [students, activePulses]);

  const totalStudents = students.length + externalStudentIds.size;
  const frictionCount = Math.min(activeStudentIds.size, totalStudents);
  const frictionRate = totalStudents > 0
    ? Math.min(100, Math.max(0, Math.round((frictionCount / totalStudents) * 100)))
    : 0;

  const radarStatus = useMemo(() => {
    if (frictionRate >= 30) {
      return { level: 'red', label: 'Derailment Risk', icon: '🔴', color: '#C84B42', pulseClass: 'red-pulse-active' };
    }
    if (frictionRate >= 15) {
      return { level: 'amber', label: 'Amber Pulse Active', icon: '🟡', color: '#C4761E', pulseClass: 'amber-pulse-active' };
    }
    return { level: 'neutral', label: 'Classroom in Flow', icon: '🟢', color: '#2B7A4B', pulseClass: '' };
  }, [frictionRate]);

  useEffect(() => {
    if (radarStatus.level === 'amber' || radarStatus.level === 'red') {
      acoustic.playPulseChime();
    }
  }, [radarStatus.level]);

  const factorCounts = useMemo(() => {
    const counts = {};
    activePulses.forEach((p) => {
      counts[p.tag] = (counts[p.tag] || 0) + 1;
    });
    return counts;
  }, [activePulses]);

  const dominantFactor = useMemo(() => {
    let top = 'step';
    let max = 0;
    Object.entries(factorCounts).forEach(([tag, count]) => {
      if (count > max) {
        max = count;
        top = tag;
      }
    });
    return top;
  }, [factorCounts]);

  const handleStudentSignal = (tagId = 'step') => {
    acoustic.playTap();
    if (navigator.vibrate) navigator.vibrate([25, 40, 25]);

    const pulse = {
      id: 'p_' + Date.now() + '_' + studentToken,
      studentId: studentToken,
      timestamp: Date.now(),
      tag: tagId,
      topic: activeTopic,
    };

    setPulses((prev) => {
      const filtered = prev.filter((p) => p.studentId !== studentToken);
      return [...filtered, pulse];
    });
    broadcast('PULSE', pulse);

    const tagObj = FRICTION_TAGS.find((t) => t.id === tagId);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStudentNotes((prev) => [
      { time: timeStr, topic: activeTopic, tag: tagObj ? tagObj.label : 'Friction signaled' },
      ...prev
    ]);
  };

  const handleStudentResolve = () => {
    acoustic.playResolve();
    setPulses((prev) => prev.filter((p) => p.studentId !== studentToken));
    broadcast('RESOLVE', { studentId: studentToken });
  };

  const handleDeployBridge = (title) => {
    acoustic.playTap();
    setInterventions((prev) => [
      { id: 'i_' + Date.now(), title, timestamp: Date.now(), topic: activeTopic },
      ...prev
    ]);
  };

  const [simFilter, setSimFilter] = useState('all');
  const [hoveredStudentId, setHoveredStudentId] = useState(null);

  // Scenario 1: The Algebraic Leap (Skips line 2.5 conjugate cancel) -> Derails 11 students
  const simAlgebraicLeap = () => {
    acoustic.playPulseChime();
    const targets = students.filter(s => s.role === 'Shy' || (s.role === 'Note Copier' && ['C1','C2','C3','C4'].includes(s.seat)));
    const newItems = targets.map((s, idx) => ({
      id: 'sim_leap_' + Date.now() + '_' + idx,
      studentId: s.id,
      timestamp: Date.now() - Math.random() * 14000,
      tag: 'step',
      topic: activeTopic,
    }));
    newItems.forEach(p => { try { broadcast('PULSE', p); } catch (e) {} });
    setPulses(prev => {
      const existing = new Set(prev.map(p => p.studentId));
      return [...prev, ...newItems.filter(p => !existing.has(p.studentId))];
    });
  };

  // Scenario 2: Pacing Sprint (Slide flipped before notes copied) -> Derails 7 Note Copiers
  const simPacingSprint = () => {
    acoustic.playPulseChime();
    const targets = students.filter(s => s.role === 'Note Copier');
    const newItems = targets.map((s, idx) => ({
      id: 'sim_pace_' + Date.now() + '_' + idx,
      studentId: s.id,
      timestamp: Date.now() - Math.random() * 9000,
      tag: 'pace',
      topic: activeTopic,
    }));
    newItems.forEach(p => { try { broadcast('PULSE', p); } catch (e) {} });
    setPulses(prev => {
      const existing = new Set(prev.map(p => p.studentId));
      return [...prev, ...newItems.filter(p => !existing.has(p.studentId))];
    });
  };

  // Scenario 3: Notation Ambiguity (Differential operator d/dx ambiguity) -> Derails 5 students
  const simNotationAmbiguity = () => {
    acoustic.playPulseChime();
    const targets = students.filter(s => ['s1', 's2', 's10', 's13', 's18'].includes(s.id));
    const newItems = targets.map((s, idx) => ({
      id: 'sim_not_' + Date.now() + '_' + idx,
      studentId: s.id,
      timestamp: Date.now() - Math.random() * 8000,
      tag: 'notation',
      topic: activeTopic,
    }));
    newItems.forEach(p => { try { broadcast('PULSE', p); } catch (e) {} });
    setPulses(prev => {
      const existing = new Set(prev.map(p => p.studentId));
      return [...prev, ...newItems.filter(p => !existing.has(p.studentId))];
    });
  };

  // Scenario 4: Socratic Recovery Cascade (Comprehension wave cascades across room)
  const simCascadeRecovery = () => {
    acoustic.playResolve();
    if (typeof window !== 'undefined' && window.confetti) {
      try {
        window.confetti({ particleCount: 50, spread: 75, origin: { y: 0.85 } });
      } catch (e) {}
    }
    const rows = ['rowA', 'rowB', 'rowC', 'rowD', 'rowE'];
    rows.forEach((rId, i) => {
      setTimeout(() => {
        setPulses(prev => {
          const rowIds = new Set(students.filter(s => s.rowId === rId).map(s => s.id));
          rowIds.forEach(stId => {
            try { broadcast('RESOLVE', { studentId: stId }); } catch (e) {}
          });
          return prev.filter(p => !rowIds.has(p.studentId));
        });
      }, (i + 1) * 220);
    });
  };

  // Scenario 5: Full Reset
  const simResetAll = () => {
    acoustic.playTap();
    students.forEach(s => {
      try { broadcast('RESOLVE', { studentId: s.id }); } catch (e) {}
    });
    setPulses([]);
  };

  // Preserved aliases for existing handlers
  const simDerailment = simAlgebraicLeap;
  const simRecovery = simCascadeRecovery;

  return (
    <div className="min-h-screen bg-[#EDE8E1] text-[#1A1B1F] flex flex-col font-sans relative overflow-x-hidden selection:bg-neutral-900 selection:text-white">
      
      {/* 1. ATMOSPHERIC ARCHITECTURAL GRID & PASTEL AURORAS (Matching KEXART) */}
      <div className="gallery-grid-backdrop"></div>
      <div className="gallery-lighting-aurora"></div>

      {/* 2. FLOATING TILTED GALLERY PAPER FRAMES IN BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
        <div
          className="tilted-gallery-card hidden md:block"
          style={{ top: '65px', left: '6%', width: '170px', height: '230px', transform: 'rotate(-8deg)' }}
        ></div>
        <div
          className="tilted-gallery-card hidden lg:block"
          style={{ top: '100px', left: '26%', width: '230px', height: '300px', transform: 'rotate(4deg)' }}
        ></div>
        <div
          className="tilted-gallery-card hidden md:block"
          style={{ top: '80px', right: '23%', width: '240px', height: '320px', transform: 'rotate(-3deg)' }}
        ></div>
        <div
          className="tilted-gallery-card hidden md:block"
          style={{ top: '115px', right: '4%', width: '210px', height: '270px', transform: 'rotate(11deg)' }}
        ></div>
      </div>

      {/* 3. GALLERY TOP NAVIGATION (Matching KEXART) */}
      <header className="gallery-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
          
          {/* Brand Logo in Bold Elegant Serif */}
          <div className="flex items-center gap-3">
            <span
              onClick={() => setActiveView('studio')}
              className="font-serif text-2xl font-bold tracking-tight text-[#111215] cursor-pointer hover:opacity-80 transition"
            >
              NUDGEPOINT
            </span>
          </div>

          {/* Centered Spaced-out Nav Links */}
          <nav className="hidden md:flex items-center gap-8 gallery-nav">
            {[
              { id: 'studio', label: 'STUDIO' },
              { id: 'podium', label: 'PODIUM' },
              { id: 'student', label: 'STUDENT' },
              { id: 'stage', label: 'STAGE' },
              { id: 'analytics', label: 'HEATMAP' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveView(link.id)}
                className={`gallery-nav-btn ${activeView === link.id ? 'active' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Button (Pill) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gallery-nav-btn hidden sm:inline-flex"
            >
              {soundEnabled ? 'AUDIO: ON' : 'AUDIO: OFF'}
            </button>
            <div className="rounded-full px-5 py-2 border border-[#CBC4B5] bg-[#F1EDE5] text-[11px] font-mono tracking-[0.18em] uppercase text-[#111215] font-medium shadow-xs whitespace-nowrap shrink-0">
              ROOM: {roomCode}
            </div>
          </div>

        </div>
      </header>

      {/* 4. HERO SECTION (Mirroring KEXART's Monumental Presentation) */}
      <section className="relative z-10 pt-16 pb-12 text-center px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Eyebrow */}
          <span className="text-[11px] font-mono uppercase tracking-[0.35em] text-[#7A7E89] mb-4">
            C L A S S R O O M &nbsp; P U L S E &nbsp; R A D A R
          </span>

          {/* Monumental Hero Headline */}
          <h1 className="font-serif font-normal text-6xl sm:text-7xl md:text-8xl tracking-tight text-[#111215] leading-none mb-6">
            NUDGEPOINT
          </h1>

          {/* Atmospheric Editorial Subtitle */}
          <p className="font-cormorant text-xl sm:text-2xl text-[#4A4E58] italic max-w-2xl leading-relaxed mb-8 font-normal">
            Detecting the subtle boundary between comprehension and derailment — an ambient pulse tool to diagnose lecture friction in real time.
          </p>

          {/* The Two Pill CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveView('podium')}
              className="btn-gallery-pill-black"
            >
              EXPLORE PODIUM
            </button>
            <button
              onClick={() => setActiveView('student')}
              className="btn-gallery-pill-outline"
            >
              JOIN AS STUDENT
            </button>
          </div>

          {/* Scroll Down Indicator */}
          <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#8C909C] flex flex-col items-center gap-1">
            <span>SCROLL</span>
            <span className="text-xs">↓</span>
          </div>

        </div>
      </section>

      {/* AMBIENT RADAR BANNER (Gentle warm pulse when friction triggers) */}
      {radarStatus.level !== 'neutral' && (
        <div
          role="status"
          aria-live="polite"
          className={`relative z-20 border-y py-3 px-6 transition-colors duration-500 ${
            radarStatus.level === 'red'
              ? 'bg-[#FDF2F2] border-[#F5C2BF] text-[#B91C1C]'
              : 'bg-[#FDF8EE] border-[#F4DCB6] text-[#B45309]'
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: radarStatus.color }} aria-hidden="true"></span>
              <span className="tracking-[0.16em] uppercase font-semibold">
                {radarStatus.icon} {radarStatus.label} — {frictionRate}% FRICTION ACTIVE
              </span>
              <span className="hidden sm:inline text-[#78716C]">
                ({frictionCount} of {totalStudents} students signaling within 90s window)
              </span>
            </div>
            <button
              onClick={simRecovery}
              className="tracking-[0.14em] uppercase font-semibold text-[#B45309] hover:text-[#78350F] underline underline-offset-4 transition"
            >
              RESOLVE ALL →
            </button>
          </div>
        </div>
      )}

      {/* 5. MAIN INTERACTIVE CONTENT DISPLAY */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col gap-12">
        
        {/* VIEW 1: DUAL STUDIO */}
        {activeView === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left 7 Columns: Podium Instrument */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
                  EXHIBITION INSTRUMENT
                </span>
                <h2 className="font-serif text-3xl font-normal text-[#111215] tracking-tight mt-1">
                  Ambient Lecture Radar
                </h2>
                <p className="text-xs text-[#575B66] mt-1 leading-relaxed">
                  Real-time cognitive load telemetry for the instructor's podium display or tablet.
                </p>
              </div>

              <GalleryPodiumComponent
                radarStatus={radarStatus}
                frictionRate={frictionRate}
                frictionCount={frictionCount}
                totalStudents={totalStudents}
                windowDurationSec={windowDurationSec}
                activePulses={activePulses}
                dominantFactor={dominantFactor}
                factorCounts={factorCounts}
                activeTopic={activeTopic}
                topics={topics}
                onSelectTopic={setActiveTopic}
                onDeployBridge={handleDeployBridge}
                questions={questions}
                onUpvoteQuestion={(id) => {
                  setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
                  broadcast('UPVOTE', { id });
                }}
                onMarkAnswered={(id) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true } : q))}
                onToggleProject={(id) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, projected: !q.projected } : q))}
              />
            </div>

            {/* Right 5 Columns: Student Mobile Surface */}
            <div className="lg:col-span-5 flex flex-col items-center gap-6">
              <div className="w-full flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
                    STUDENT CLIENT
                  </span>
                  <h3 className="font-serif text-xl font-normal text-[#111215] mt-0.5">Mobile Zero-Login</h3>
                </div>
                <span className="text-[10px] font-mono text-[#7A7E89] px-3 py-1 rounded-full border border-[#DDD7CB] bg-[#F1EDE5]">
                  {studentToken === 's1' ? 'SEAT E1 • MARCUS CHEN' : 'ANONYMOUS'}
                </span>
              </div>

              {/* Minimal Gallery Phone Enclosure */}
              <div className="w-full max-w-[360px] gallery-panel p-8 flex flex-col justify-between min-h-[590px]">
                <GalleryStudentComponent
                  roomCode={roomCode}
                  courseName={courseName}
                  activeTopic={activeTopic}
                  activeStudentPulse={activeStudentPulse}
                  studentToken={studentToken}
                  onSignal={handleStudentSignal}
                  onResolve={handleStudentResolve}
                  questions={questions}
                  onAskQuestion={(text) => {
                    const q = { id: 'q_' + Date.now(), text, upvotes: 1, timestamp: Date.now(), answered: false, projected: false };
                    setQuestions((prev) => [q, ...prev]);
                    broadcast('QUESTION', q);
                  }}
                  onUpvoteQuestion={(id) => {
                    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
                    broadcast('UPVOTE', { id });
                  }}
                  notes={studentNotes}
                />
              </div>
            </div>

          </div>
        )}

        {/* SERVER NOTICE BANNER (Rate limiting & Moderation feedback) */}
        {serverNotice && (
          <div role="alert" aria-live="assertive" className="max-w-xl mx-auto mb-4 w-full bg-[#FDF6EB] border border-[#EAD1A8] rounded-2xl py-3 px-5 text-center text-xs font-mono text-[#9A5B0F] flex items-center justify-center gap-2 shadow-sm">
            <span>🛡️</span>
            <span>{serverNotice}</span>
          </div>
        )}

        {/* VIEW 2: DEDICATED TEACHER PODIUM (Role-Gated with Teacher PIN) */}
        {activeView === 'podium' && (
          !isTeacherAuthenticated ? (
            <div className="max-w-md mx-auto w-full py-8">
              <div className="gallery-panel p-8 flex flex-col gap-6 text-center shadow-lg">
                <div className="w-12 h-12 rounded-full bg-[#111215] text-[#EDE8E1] flex items-center justify-center mx-auto text-xl">
                  🔒
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
                    ROLE GATING • TEACHER PODIUM
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-[#111215] mt-1">
                    Instructor Verification
                  </h3>
                  <p className="text-xs text-[#575B66] mt-2 leading-relaxed">
                    Live classroom telemetry and pedagogical bridge controls are reserved for instructors. Please enter the room passkey.
                  </p>
                </div>

                <form onSubmit={handleVerifyTeacherPin} className="flex flex-col gap-4">
                  <div>
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      className="w-full text-center tracking-[0.3em] font-mono text-lg py-3 px-4 rounded-xl border border-[#DDD7CB] bg-[#FAF8F4] text-[#111215] focus:outline-none focus:border-[#111215]"
                      maxLength={8}
                    />
                    {pinError && (
                      <span className="text-xs text-[#B91C1C] block mt-1.5 font-sans font-medium">
                        {pinError}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[#7A7E89] block mt-2">
                      Default Demo Room CALC PIN: <strong>8492</strong>
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn-gallery-pill-black w-full"
                  >
                    AUTHENTICATE PODIUM
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setActiveView('student')}
                  className="text-xs font-mono text-[#575B66] hover:text-[#111215] underline"
                >
                  ← Return to Student View
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
              <div className="border-b border-[#EAE6DF] pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
                    PODIUM FULL SURFACE
                  </span>
                  <h2 className="font-serif text-3xl font-normal text-[#111215] tracking-tight mt-1">
                    Classroom Comprehension Radar
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${
                    socketConnected ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}>
                    {socketConnected ? '🟢 Live WebSocket' : '🟠 Local Sync'}
                  </span>
                  <button
                    onClick={handleLogoutTeacher}
                    className="text-[10px] font-mono text-[#7A7E89] hover:text-[#111215] underline"
                  >
                    Lock 🔒
                  </button>
                </div>
              </div>

              <GalleryPodiumComponent
                radarStatus={radarStatus}
                frictionRate={frictionRate}
                frictionCount={frictionCount}
                totalStudents={totalStudents}
                windowDurationSec={windowDurationSec}
                activePulses={activePulses}
                dominantFactor={dominantFactor}
                factorCounts={factorCounts}
                activeTopic={activeTopic}
                topics={topics}
                onSelectTopic={setActiveTopic}
                onDeployBridge={handleDeployBridge}
                questions={questions}
                onUpvoteQuestion={(id) => {
                  setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
                  broadcast('UPVOTE', { id });
                }}
                onMarkAnswered={(id) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true } : q))}
                onToggleProject={(id) => {
                  const q = questions.find((item) => item.id === id);
                  const nextVal = q ? !q.projected : true;
                  setQuestions((prev) => prev.map((item) => item.id === id ? { ...item, projected: nextVal } : item));
                  broadcast('PROJECT_QUESTION', { id, projected: nextVal });
                }}
              />
            </div>
          )
        )}

        {/* VIEW 3: DEDICATED STUDENT PHONE */}
        {activeView === 'student' && (
          <div className="max-w-sm mx-auto w-full py-6">
            <div className="gallery-panel p-8 flex flex-col justify-between min-h-[620px]">
              <GalleryStudentComponent
                roomCode={roomCode}
                courseName={courseName}
                activeTopic={activeTopic}
                activeStudentPulse={activeStudentPulse}
                studentToken={studentToken}
                onSignal={handleStudentSignal}
                onResolve={handleStudentResolve}
                questions={questions}
                onAskQuestion={(text) => {
                  const q = { id: 'q_' + Date.now(), text, upvotes: 1, timestamp: Date.now(), answered: false, projected: false };
                  setQuestions((prev) => [q, ...prev]);
                  broadcast('QUESTION', q);
                }}
                onUpvoteQuestion={(id) => {
                  setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
                  broadcast('UPVOTE', { id });
                }}
                notes={studentNotes}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: PROJECTOR STAGE DISPLAY */}
        {activeView === 'stage' && (
          <GalleryStageComponent
            roomCode={roomCode}
            courseName={courseName}
            activeTopic={activeTopic}
            radarStatus={radarStatus}
            projectedQuestions={questions.filter((q) => q.projected)}
            totalStudents={totalStudents}
          />
        )}

        {/* VIEW 5: DERAILMENT HEATMAP */}
        {activeView === 'analytics' && (
          <GalleryAnalyticsComponent
            courseName={courseName}
            roomCode={roomCode}
            topics={topics}
            pulses={pulses}
            interventions={interventions}
            questions={questions}
            totalStudents={totalStudents}
          />
        )}

        {/* SIMULATION CONSOLE (IMMERSIVE LECTURE HALL AMPHITHEATER RADAR) */}
        {showFlightSim && (
          <section className="border-t border-[#DDD7CB] pt-10 pb-4">
            <div className="gallery-panel p-8 bg-[#F5F1EA] shadow-md border border-[#D8D1C2]">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono tracking-[0.28em] uppercase text-[#7A7E89] block">
                    TESTING HARNESS • LECTURE COGNITIVE RADAR
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-[#111215] mt-1">
                    Classroom Flight Simulator (35 Students)
                  </h3>
                  <p className="text-xs text-[#575B66] mt-1 max-w-2xl leading-relaxed">
                    Interactive tiered amphitheater model. Stress-test friction velocity, simulate STEM derailment cascades, and observe teacher bridge triggers in real time.
                  </p>
                </div>

                {/* Scenario Trigger Dock */}
                <div className="hall-scenario-toolbar">
                  <button
                    onClick={simAlgebraicLeap}
                    className="hall-scenario-btn amber"
                    title="Skips Line 2.5: Derails 11 students across Shy Corner and Note Copiers"
                  >
                    <span>⚡</span>
                    <span>+11 Algebraic Leap</span>
                  </button>
                  <button
                    onClick={simPacingSprint}
                    className="hall-scenario-btn outline"
                    title="Rapid slide advance: Derails 7 Note Copiers with 'Pacing Too Fast'"
                  >
                    <span>⏩</span>
                    <span>+7 Pacing Sprint</span>
                  </button>
                  <button
                    onClick={simNotationAmbiguity}
                    className="hall-scenario-btn outline"
                    title="Ambiguous differential operator: Derails 5 students with 'Notation Confusion'"
                  >
                    <span>🌫️</span>
                    <span>+5 Notation</span>
                  </button>
                  <button
                    onClick={simCascadeRecovery}
                    className="hall-scenario-btn primary"
                    title="Teacher deploys bridge script: Cascades comprehension row-by-row"
                  >
                    <span>💡</span>
                    <span>Socratic Recovery</span>
                  </button>
                  <button
                    onClick={simResetAll}
                    className="hall-scenario-btn reset"
                    title="Clear all active friction pulses"
                  >
                    <span>🔄 Reset</span>
                  </button>
                </div>
              </div>

              {/* Architectural Lectern Stage Banner at Front of Hall */}
              <div className="hall-stage-lectern">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EDE8E1] text-[#111215] flex items-center justify-center text-sm font-bold shadow-xs">
                    👨‍🏫
                  </div>
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.22em] uppercase text-[#A6ABB8]">
                      LECTERN SIGHTLINE • PROFESSOR DERIVATION STAGE
                    </div>
                    <div className="text-xs font-serif font-medium text-[#EDE8E1] mt-0.5">
                      Chalkboard: <em>f'(x) = lim_{'{'}h→0{'}'} [√(x+h) - √x] / h</em> &nbsp;•&nbsp; <strong>Step 3: Conjugate Substitution</strong>
                    </div>
                  </div>
                </div>

                {/* Live Seated Census Stats */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="hall-telemetry-pill">
                    CENSUS: <strong>{totalStudents} SEATED</strong>
                  </span>
                  <span className="hall-telemetry-pill">
                    FLOW: <strong className="text-emerald-400">{totalStudents - frictionCount}</strong>
                  </span>
                  <span className={`hall-telemetry-pill ${frictionCount > 0 ? '!bg-[#C4761E] !text-white !border-[#C4761E]' : ''}`}>
                    LOST: <strong>{frictionCount} ({frictionRate}%)</strong>
                  </span>
                </div>
              </div>

              {/* Persona Filter Strip */}
              <div className="hall-filter-toolbar">
                <span className="text-[10px] font-mono uppercase text-[#7A7E89] mr-2">Filter View:</span>
                {[
                  { id: 'all', label: `All Seats (${totalStudents})` },
                  { id: 'lost', label: `Lost Only (${frictionCount})` },
                  { id: 'shy', label: `Shy Strugglers (${students.filter(s => s.role === 'Shy').length})` },
                  { id: 'note', label: `Note Copiers (${students.filter(s => s.role === 'Note Copier').length})` },
                  { id: 'flow', label: `Attentive Flow (${students.filter(s => s.role === 'Attentive').length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSimFilter(tab.id)}
                    className={`hall-filter-btn ${simFilter === tab.id ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 5 Amphitheater Seating Tiers */}
              <div className="hall-amphitheater">
                {LECTURE_ROWS.map(row => {
                  const rowStudents = students.filter(s => s.rowId === row.id);
                  const filteredStudents = rowStudents.filter(s => {
                    if (simFilter === 'lost') return activeStudentIds.has(s.id);
                    if (simFilter === 'shy') return s.role === 'Shy';
                    if (simFilter === 'note') return s.role === 'Note Copier';
                    if (simFilter === 'flow') return s.role === 'Attentive';
                    return true;
                  });

                  const lostInRow = rowStudents.filter(s => activeStudentIds.has(s.id)).length;

                  return (
                    <div key={row.id} className="hall-row">
                      <div className="hall-row-header">
                        <div className="flex items-center gap-3">
                          <span className="hall-row-title">{row.name}</span>
                          <span className="hall-row-desc hidden md:inline">— {row.desc}</span>
                        </div>
                        <span className={`hall-row-count ${lostInRow > 0 ? 'has-lost' : ''}`}>
                          {lostInRow > 0 ? `⚡ ${lostInRow} of 7 Struggling` : `🟢 7 in Flow`}
                        </span>
                      </div>

                      <div className="hall-row-grid">
                        {filteredStudents.length === 0 ? (
                          <div className="col-span-full py-3 text-center text-xs font-mono text-[#8C909C]">
                            No students match active filter in this tier.
                          </div>
                        ) : (
                          filteredStudents.map(st => {
                            const isLost = activeStudentIds.has(st.id);
                            const roleSlug = st.role === 'Shy' ? 'shy' : st.role === 'Note Copier' ? 'note' : 'flow';
                            const personaShort = st.role === 'Shy' ? 'SHY' : st.role === 'Note Copier' ? 'NOTE' : 'FLOW';

                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  acoustic.playTap();
                                  if (isLost) {
                                    setPulses(prev => prev.filter(p => p.studentId !== st.id));
                                    try { broadcast('RESOLVE', { studentId: st.id }); } catch (e) {}
                                  } else {
                                    const p = {
                                      id: 'p_' + Date.now() + '_' + st.id,
                                      studentId: st.id,
                                      timestamp: Date.now(),
                                      tag: st.role === 'Note Copier' ? 'pace' : 'step',
                                      topic: activeTopic
                                    };
                                    setPulses(prev => [...prev, p]);
                                    try { broadcast('PULSE', p); } catch (e) {}
                                  }
                                }}
                                onMouseEnter={() => setHoveredStudentId(st.id)}
                                onMouseLeave={() => setHoveredStudentId(null)}
                                className={`hall-seat-card ${isLost ? 'is-lost' : 'is-flow'}`}
                                aria-pressed={isLost}
                                title={`${st.name} [Seat ${st.seat}] (${st.role}) — Click to toggle friction`}
                              >
                                <div className="hall-seat-top">
                                  <span className="hall-seat-tag">{st.seat}</span>
                                  <span className={`hall-seat-status ${isLost ? 'lost' : 'flow'}`}>
                                    <span className="hall-seat-status-beacon"></span>
                                    <span>{isLost ? 'LOST' : 'FLOW'}</span>
                                  </span>
                                </div>

                                <div className="hall-seat-middle">
                                  <div className={`hall-seat-avatar ${roleSlug}`}>
                                    {st.initials}
                                  </div>
                                  <div className="overflow-hidden">
                                    <span className="hall-seat-name">{st.name}</span>
                                    <span className={`student-chip-persona persona-badge-${roleSlug}`}>
                                      {personaShort}
                                    </span>
                                  </div>
                                </div>

                                <div className="hall-seat-thought" title={st.thought}>
                                  💭 “{st.thought}”
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </section>
        )}

      </main>

      {/* GALLERY MINIMAL FOOTER */}
      <footer className="relative z-10 border-t border-[#EAE6DF] py-8 px-6 text-center text-xs text-[#7A7E89] font-mono tracking-[0.18em] uppercase">
        NUDGEPOINT &nbsp;—&nbsp; ZERO-LOGIN CLASSROOM PULSE RADAR
      </footer>

    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. GALLERY PODIUM COMPONENT
// ----------------------------------------------------------------------------
function GalleryPodiumComponent({
  radarStatus,
  frictionRate,
  frictionCount,
  totalStudents,
  windowDurationSec,
  activePulses,
  dominantFactor,
  factorCounts,
  activeTopic,
  topics,
  onSelectTopic,
  onDeployBridge,
  questions,
  onUpvoteQuestion,
  onMarkAnswered,
  onToggleProject,
}) {
  const [activeSubTab, setActiveSubTab] = useState('radar');

  const activeBridges = PEDAGOGICAL_BRIDGES[dominantFactor] || PEDAGOGICAL_BRIDGES.step;
  const socratic = SOCRATIC_BREAKDOWNS[activeTopic] || SOCRATIC_BREAKDOWNS.default;

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. RADAR TELEMETRY CARD */}
      <div
        role="status"
        aria-live="polite"
        aria-label={`Radar Telemetry: ${radarStatus.label}, ${frictionRate}% friction rate, ${frictionCount} of ${totalStudents} students struggling`}
        className={`gallery-panel p-8 transition-all duration-500 ${
          radarStatus.level === 'red'
            ? 'red-pulse-active'
            : radarStatus.level === 'amber'
            ? 'amber-pulse-active'
            : ''
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-6 pb-6 border-b border-[#EAE6DF]">
          
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
              RADAR TELEMETRY • {windowDurationSec}S WINDOW
            </span>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: radarStatus.color }} aria-hidden="true"></span>
              <span className="text-base" aria-hidden="true">{radarStatus.icon}</span>
              <h3 className="font-serif text-2xl font-normal text-[#111215]">
                {radarStatus.label}
              </h3>
            </div>
          </div>

          <div className="flex items-baseline gap-8">
            <div>
              <div className="text-5xl font-serif font-normal tabular-nums text-[#111215]">
                {frictionRate}<span className="text-2xl font-sans text-[#7A7E89]">%</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#7A7E89] block mt-1">
                Friction Rate
              </span>
            </div>

            <div className="border-l border-[#EAE6DF] pl-8">
              <div className="text-5xl font-serif font-normal tabular-nums text-[#111215]">
                {frictionCount} <span className="text-xl font-sans text-[#7A7E89]">/ {totalStudents}</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#7A7E89] block mt-1">
                Struggling
              </span>
            </div>
          </div>

        </div>

        {/* Velocity Sparkline */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs font-mono text-[#7A7E89] mb-2">
            <span className="tracking-[0.12em] uppercase">Friction Velocity (Pulses/min)</span>
            <span>{activePulses.length} events logged</span>
          </div>
          <GallerySparkline pulses={activePulses} windowDurationSec={windowDurationSec} statusColor={radarStatus.color} />
        </div>

        {/* Nuance Tag Pills */}
        <div className="nuance-tag-grid">
          {FRICTION_TAGS.map((tag) => {
            const count = factorCounts[tag.id] || 0;
            const isTop = tag.id === dominantFactor && count > 0;
            return (
              <div
                key={tag.id}
                className={`gallery-nuance-pill ${isTop ? 'active' : ''}`}
              >
                <span>{tag.label}</span>
                <span className="font-mono text-[#7A7E89]">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SUB NAVIGATION PILLS */}
      <div className="subnav-bar">
        {[
          { id: 'radar', label: 'MILESTONES' },
          { id: 'bridges', label: `BRIDGE PROMPTS (${activeBridges.length})` },
          { id: 'socratic', label: 'STEP CLARIFIER' },
          { id: 'questions', label: `BACKCHANNEL (${questions.filter((q) => !q.answered).length})` },
        ].map((sTab) => (
          <button
            key={sTab.id}
            onClick={() => setActiveSubTab(sTab.id)}
            className={`subnav-tab-btn ${activeSubTab === sTab.id ? 'active' : ''}`}
          >
            {sTab.label}
          </button>
        ))}
      </div>

      {/* 3. MILESTONES TAB */}
      {activeSubTab === 'radar' && (
        <div className="gallery-panel p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-3 border-b border-[#EAE6DF] pb-2">
            <span className="font-serif text-lg text-[#111215]">Lecture Milestones</span>
            <span className="text-xs font-mono text-[#7A7E89] uppercase tracking-wider">ACTIVE: {activeTopic}</span>
          </div>
          <ul className="milestone-list">
            {topics.map((t) => {
              const isActive = t.title === activeTopic;
              return (
                <li
                  key={t.id}
                  onClick={() => onSelectTopic(t.title)}
                  className={`milestone-item ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="milestone-time">{t.timestamp}</span>
                    <span className="milestone-title">{t.title}</span>
                  </div>
                  {isActive && (
                    <span className="milestone-badge">
                      EXPLAINING
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 4. PEDAGOGICAL BRIDGE PROMPTS */}
      {activeSubTab === 'bridges' && (
        <div className="flex flex-col gap-4">
          {activeBridges.map((bridge, idx) => (
            <div key={idx} className="gallery-panel p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                <span className="text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#C4761E]">
                  {bridge.title}
                </span>
                <span className="text-[10px] font-mono text-[#7A7E89] uppercase tracking-[0.14em]">
                  PEDAGOGICAL BRIDGE
                </span>
              </div>
              <blockquote className="font-cormorant text-xl text-[#292B30] italic leading-relaxed pl-4 border-l-2 border-[#C4761E]">
                “{bridge.script}”
              </blockquote>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#7A7E89] leading-normal max-w-md">
                  {bridge.rationale}
                </span>
                <button
                  onClick={() => onDeployBridge(bridge.title)}
                  className="btn-gallery-pill-outline !py-2 !px-5 text-[10px]"
                >
                  DEPLOYED
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. SOCRATIC STEP CLARIFIER */}
      {activeSubTab === 'socratic' && (
        <div className="gallery-panel p-8 flex flex-col gap-6">
          <div className="border-b border-[#EAE6DF] pb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
              SOCRATIC BREAKDOWN
            </span>
            <h4 className="font-serif text-xl text-[#111215] mt-1">{activeTopic}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#7A7E89]">
                PHYSICAL INTUITION
              </span>
              <p className="text-xs text-[#383B42] leading-relaxed font-normal">
                {socratic.analogy}
              </p>
            </div>

            <div className="flex flex-col gap-2 border-l border-[#EAE6DF] pl-6">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#C4761E] font-semibold">
                SKIPPED MICRO-STEP
              </span>
              <p className="text-xs text-[#111215] font-mono leading-relaxed">
                {socratic.microStep}
              </p>
            </div>

            <div className="flex flex-col gap-2 border-l border-[#EAE6DF] pl-6">
              <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#7A7E89]">
                SANITY CHECK
              </span>
              <p className="text-xs text-[#383B42] leading-relaxed">
                {socratic.boundaryCheck}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. ANONYMOUS QUESTIONS QUEUE */}
      {activeSubTab === 'questions' && (
        <div className="gallery-panel p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-3 border-b border-[#EAE6DF] pb-2">
            <span className="font-serif text-lg text-[#111215]">Student Backchannel</span>
            <span className="text-xs font-mono text-[#7A7E89] uppercase tracking-wider">SORTED BY UPVOTES</span>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs text-[#7A7E89] py-6 text-center font-mono">No questions submitted yet.</p>
          ) : (
            <ul className="milestone-list">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
                    q.answered
                      ? 'border-[#DDD7CB] bg-[#EBE6DD] opacity-60'
                      : q.projected
                      ? 'border-[#C4761E] bg-[#F5ECE0] shadow-xs'
                      : 'border-[#DDD7CB] bg-[#FAF8F4]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono font-bold text-[#C4761E] bg-[#F5ECE0] border border-[#EAD1A8] px-2.5 py-1 rounded-full shrink-0">
                      +{q.upvotes}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-[#111215] leading-relaxed">{q.text}</div>
                      <span className="text-[10px] font-mono text-[#7A7E89] mt-0.5 block">
                        {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {q.projected ? ' • PROJECTED ON STAGE' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!q.answered && (
                      <button
                        onClick={() => onToggleProject(q.id)}
                        className="btn-gallery-pill-outline !py-1.5 !px-3 text-[10px]"
                      >
                        {q.projected ? 'Unproject' : 'Project'}
                      </button>
                    )}
                    {!q.answered ? (
                      <button
                        onClick={() => onMarkAnswered(q.id)}
                        className="btn-gallery-pill-outline !py-1.5 !px-3 text-[10px]"
                      >
                        Answered
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-[#7A7E89] font-medium">ANSWERED</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------------------------------
// 5. GALLERY STUDENT MOBILE CLIENT
// ----------------------------------------------------------------------------
function GalleryStudentComponent({
  roomCode,
  courseName,
  activeTopic,
  activeStudentPulse,
  studentToken,
  onSignal,
  onResolve,
  questions,
  onAskQuestion,
  onUpvoteQuestion,
  notes,
}) {
  const [subTab, setSubTab] = useState('pulse');
  const [chosenFactor, setChosenFactor] = useState('step');
  const [qText, setQText] = useState('');

  const isSignaled = !!activeStudentPulse;

  const handleAsk = (e) => {
    e.preventDefault();
    if (qText.trim()) {
      onAskQuestion(qText.trim());
      setQText('');
    }
  };

  return (
    <div className="flex flex-col h-full justify-between gap-6">
      
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#7A7E89] uppercase tracking-[0.25em]">
                ROOM {roomCode}
              </span>
              {studentToken === 's1' && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#FDF1EA] text-[#B25828] border border-[#EAD1A8]">
                  SEAT E1 • SHY
                </span>
              )}
            </div>
            <div className="font-serif text-sm font-semibold text-[#111215] truncate" title={courseName}>
              {courseName}
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#2B7A4B]"></span>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
          <span className="text-[9px] font-mono text-[#7A7E89] uppercase tracking-[0.2em] block">
            CURRENT MILESTONE
          </span>
          <div className="text-xs font-medium text-[#111215] truncate mt-0.5">
            {activeTopic}
          </div>
        </div>
      </div>

      {/* Main Pulse Surface */}
      {subTab === 'pulse' && (
        <div className="my-auto flex flex-col items-center text-center py-4">
          
          {/* SCULPTURAL CIRCULAR HERO BUTTON */}
          <button
            onClick={() => onSignal(chosenFactor)}
            className={`btn-student-sculpted ${isSignaled ? 'is-lost' : ''}`}
          >
            <span className="font-serif text-xl font-normal tracking-tight uppercase">
              {isSignaled ? 'LOST HERE' : 'LOST HERE'}
            </span>
            <span className={`text-[10px] mt-1 font-mono tracking-wider max-w-[110px] leading-tight ${isSignaled ? 'text-zinc-300' : 'text-[#7A7E89]'}`}>
              {isSignaled ? 'SIGNAL ACTIVE' : 'TAP TO SIGNAL'}
            </span>
          </button>

          {/* Resolution Action */}
          {isSignaled ? (
            <div className="mt-8 w-full flex flex-col gap-2">
              <button
                onClick={onResolve}
                className="btn-gallery-pill-black w-full"
              >
                RESOLVED — I GET IT
              </button>
              <span className="text-[10px] font-mono text-[#7A7E89]">
                Clears friction from podium radar
              </span>
            </div>
          ) : (
            <div className="mt-8 w-full">
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-2">
                NUANCE CATEGORY
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {FRICTION_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setChosenFactor(tag.id)}
                    className={`gallery-nuance-pill ${chosenFactor === tag.id ? 'active' : ''}`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Backchannel Question View */}
      {subTab === 'question' && (
        <div className="my-auto flex flex-col gap-4 py-2">
          <form onSubmit={handleAsk} className="flex flex-col gap-2">
            <input
              type="text"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Ask a 1-line question..."
              maxLength={80}
              className="w-full px-3 py-2.5 rounded-full bg-[#F8F5EF] border border-[#CBC4B5] text-xs text-[#111215] placeholder-[#A6ABB8] focus:outline-none focus:border-[#111215] transition"
            />
            <button
              type="submit"
              className="btn-gallery-pill-black !py-2 text-[10px]"
            >
              SUBMIT ANONYMOUSLY
            </button>
          </form>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pt-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-[#FAF8F4] border border-[#DDD7CB] flex items-center justify-between text-xs"
              >
                <span className="text-[#383B42] text-xs pr-2">{q.text}</span>
                <button
                  onClick={() => onUpvoteQuestion(q.id)}
                  className="px-2.5 py-1 rounded-full bg-[#F5ECE0] border border-[#EAD1A8] text-[#C4761E] font-mono text-xs font-bold transition"
                >
                  +{q.upvotes}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private Notes View */}
      {subTab === 'notes' && (
        <div className="my-auto flex flex-col gap-3 py-2 max-h-72 overflow-y-auto">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89]">
            PERSONAL LOG
          </div>
          {notes.map((n, i) => (
            <div key={i} className="p-3 rounded-xl bg-[#FAF8F4] border border-[#DDD7CB] text-xs">
              <div className="flex items-center justify-between font-mono text-[10px] text-[#7A7E89] mb-1">
                <span>{n.time}</span>
                <span className="text-[#C4761E] font-semibold">{n.tag}</span>
              </div>
              <div className="text-[#111215] font-normal">{n.topic}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Nav Segment */}
      <div className="pt-3 border-t border-[#DDD7CB] flex items-center justify-around text-[10px] font-mono tracking-[0.2em] uppercase">
        <button
          onClick={() => setSubTab('pulse')}
          className={`transition ${subTab === 'pulse' ? 'text-[#111215] font-bold' : 'text-[#7A7E89] hover:text-[#111215]'}`}
        >
          PULSE
        </button>
        <button
          onClick={() => setSubTab('question')}
          className={`transition ${subTab === 'question' ? 'text-[#111215] font-bold' : 'text-[#7A7E89] hover:text-[#111215]'}`}
        >
          ASK
        </button>
        <button
          onClick={() => setSubTab('notes')}
          className={`transition ${subTab === 'notes' ? 'text-[#111215] font-bold' : 'text-[#7A7E89] hover:text-[#111215]'}`}
        >
          LOG ({notes.length})
        </button>
      </div>

    </div>
  );
}

// ----------------------------------------------------------------------------
// 6. GALLERY PROJECTOR STAGE DISPLAY
// ----------------------------------------------------------------------------
function GalleryStageComponent({
  roomCode,
  courseName,
  activeTopic,
  radarStatus,
  projectedQuestions,
  totalStudents,
}) {
  const qrRef = useRef(null);

  useEffect(() => {
    if (qrRef.current && window.QRCode) {
      qrRef.current.innerHTML = '';
      const url = window.location.origin + window.location.pathname + '#room=' + roomCode + '&view=student';
      new QRCode(qrRef.current, {
        text: url,
        width: 140,
        height: 140,
        colorDark: '#111215',
        colorLight: '#F7F4EE',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }
  }, [roomCode]);

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-10 py-10">
      
      <div className="gallery-panel p-12 text-left relative overflow-hidden bg-[#F7F4EE]">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
              CLASSROOM RADAR
            </span>
            <h2 className="font-serif text-4xl font-normal tracking-tight text-[#111215] mt-2">
              {courseName}
            </h2>
            <p className="text-sm text-[#575B66] mt-2 max-w-lg leading-relaxed">
              Zero logins. Anonymous. If you lose track of an algebraic step, tap <em>Lost Here</em> on your phone.
            </p>

            <div className="mt-8 flex items-baseline gap-6">
              <div className="p-4 px-6 rounded-2xl bg-[#EBE6DD] border border-[#DDD7CB]">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89] block">
                  ROOM PIN
                </span>
                <div className="font-serif text-5xl font-normal text-[#C4761E] tracking-widest mt-1">
                  {roomCode}
                </div>
              </div>

              <div className="text-xs font-mono text-[#7A7E89] leading-relaxed">
                <div>URL: <strong className="text-[#111215]">nudgepoint.app/{roomCode}</strong></div>
                <div className="mt-0.5">Works on any browser</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div ref={qrRef} className="p-3 bg-[#FAF8F4] border border-[#DDD7CB] rounded-2xl shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                  window.location.origin + window.location.pathname + '#room=' + roomCode + '&view=student'
                )}`}
                alt="Room QR Code"
                className="w-[140px] h-[140px]"
              />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89] mt-3">
              SCAN TO JOIN
            </span>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-[#DDD7CB] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89] block">
              CURRENT TOPIC
            </span>
            <div className="font-serif text-base text-[#111215] mt-0.5">
              {activeTopic}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#7A7E89]">{totalStudents} in room</span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: radarStatus.color }}></span>
          </div>
        </div>

      </div>

      {/* Projected Question */}
      {projectedQuestions.length > 0 && (
        <div className="gallery-panel p-8 border-[#C4761E] bg-[#F5ECE0]">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C4761E] font-semibold block mb-2">
            SPOTLIGHT QUESTION
          </span>
          {projectedQuestions.map((q) => (
            <div key={q.id} className="font-cormorant text-2xl text-[#111215] italic leading-relaxed">
              “{q.text}”
              <span className="text-xs font-mono text-[#7A7E89] not-italic ml-4">
                ({q.upvotes} peers seconded)
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------------------------------
// 7. GALLERY ANALYTICS & HEATMAP
// ----------------------------------------------------------------------------
function GalleryAnalyticsComponent({
  courseName,
  roomCode,
  topics,
  pulses,
  interventions,
  questions,
  totalStudents,
}) {
  const [downloaded, setDownloaded] = useState(false);

  const total = pulses.length;
  const stepCount = pulses.filter((p) => p.tag === 'step').length;

  const handleExport = () => {
    const md = `# NudgePoint Debrief Report — ${courseName} (Room ${roomCode})
Date: ${new Date().toLocaleDateString()}
Total Active Students: ${totalStudents}
Total Friction Pulses: ${total}

## Summary
- Hardest Step: Topic 3 (Conjugate Substitution)
- Primary Friction Factor: ${Math.round((stepCount / Math.max(1, total)) * 100)}% Step Transition
- Teacher Interventions: ${interventions.length} Deployed

## Topic Breakdown
${topics.map((t) => `- ${t.title}: ${pulses.filter((p) => p.topic === t.title).length} pulses`).join('\n')}

## Student Questions
${questions.map((q) => `- [${q.upvotes} votes] ${q.text}`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NudgePoint_${roomCode}_Debrief.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-8">
      
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#DDD7CB] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
            POST-LECTURE DEBRIEF
          </span>
          <h2 className="font-serif text-3xl font-normal text-[#111215] tracking-tight mt-1">
            Derailment Heatmap
          </h2>
        </div>

        <button
          onClick={handleExport}
          className="btn-gallery-pill-black !py-2 !px-6 text-[10px]"
        >
          {downloaded ? 'DOWNLOADED MARKDOWN' : 'EXPORT MARKDOWN'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Flow Index', val: '86%', sub: 'Lecture in flow' },
          { label: 'Peak Friction', val: 'Topic 3', sub: 'Minute 18:40' },
          { label: 'Primary Cause', val: 'Step Transition', sub: '58% of pulses' },
          { label: 'Interventions', val: `${interventions.length} Deployed`, sub: 'Bridges used' },
        ].map((m, idx) => (
          <div key={idx} className="gallery-panel p-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#7A7E89] block">
              {m.label}
            </span>
            <div className="font-serif text-2xl font-normal text-[#111215] mt-1">
              {m.val}
            </div>
            <span className="text-[10px] font-mono text-[#7A7E89] block mt-0.5">
              {m.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline Breakdown */}
      <div className="gallery-panel p-8 flex flex-col gap-6">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
          FRICTION BREAKDOWN BY MILESTONE
        </span>

        <div className="flex flex-col gap-4">
          {topics.map((t, idx) => {
            const count = pulses.filter((p) => p.topic === t.title).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isSpike = idx === 2;

            return (
              <div key={t.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={isSpike ? 'text-[#C4761E] font-semibold' : 'text-[#383B42]'}>
                    {t.timestamp} — {t.title}
                  </span>
                  <span className="text-[#7A7E89]">{count} pulses ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#DDD7CB] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isSpike ? 'bg-[#C4761E]' : 'bg-[#575B66]'}`}
                    style={{ width: `${Math.max(4, pct)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------------------------------
// 8. GALLERY SPARKLINE CANVAS
// ----------------------------------------------------------------------------
function GallerySparkline({ pulses, windowDurationSec, statusColor }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const now = Date.now();
    const bucketsCount = 30;
    const bucketDuration = (windowDurationSec * 1000) / bucketsCount;
    const buckets = new Array(bucketsCount).fill(0);

    pulses.forEach((p) => {
      const age = now - p.timestamp;
      if (age >= 0 && age <= windowDurationSec * 1000) {
        const b = bucketsCount - 1 - Math.floor(age / bucketDuration);
        if (b >= 0 && b < bucketsCount) buckets[b]++;
      }
    });

    const maxVal = Math.max(3, Math.max(...buckets));

    // Baseline
    ctx.strokeStyle = '#DDD7CB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 2);
    ctx.lineTo(width, height - 2);
    ctx.stroke();

    // Smooth curve
    ctx.beginPath();
    const step = width / (bucketsCount - 1);
    buckets.forEach((val, i) => {
      const x = i * step;
      const y = height - 4 - (val / maxVal) * (height - 12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 1.75;
    ctx.stroke();
  }, [pulses, windowDurationSec, statusColor]);

  return (
    <div className="w-full h-12 pt-1">
      <canvas ref={canvasRef} width={600} height={48} className="w-full h-full block" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// 9. REACT MOUNT
// ----------------------------------------------------------------------------
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<NudgePointApp />);
}
