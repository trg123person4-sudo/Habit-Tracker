// ============================================================================
// NUDGEPOINT — Contemporary Gallery & Exhibition Aesthetic
// Inspired by High-Contrast Editorial Typography, Architectural Grids, & Pastel Auras
// ============================================================================

const { useState, useEffect, useMemo, useRef } = React;

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
    } catch (e) {
      // Best-effort audio playback; silently ignore browser autoplay policy restrictions before user gesture
    }
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
    } catch (e) {
      // Best-effort audio playback; silently ignore browser autoplay policy restrictions before user gesture
    }
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
    } catch (e) {
      // Best-effort audio playback; silently ignore browser autoplay policy restrictions before user gesture
    }
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
// 2B. RBAC AUTHENTICATION & DEMO SWITCHER MODAL
// ----------------------------------------------------------------------------
function AuthModal({ isOpen, onClose, onLogin, onSignup, currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const handlePresetSelect = async (presetEmail, presetPass, presetName, presetRole) => {
    setError('');
    setLoading(true);
    const res = await onLogin(presetEmail, presetPass);
    if (!res.success) {
      // Fallback: register preset if account does not exist
      const sRes = await onSignup(presetEmail, presetPass, presetName, presetRole);
      if (!sRes.success) {
        setError(res.error || sRes.error);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    onClose();
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await onLogin(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed.');
    } else {
      onClose();
    }
  };

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await onSignup(email, password, fullName, role);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Registration failed.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF8F4] border border-[#DDD7CB] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 text-lg w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200/50 transition"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Eyebrow & Title */}
        <div className="mb-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89] block mb-1">
            ROLE-BASED ACCESS CONTROL (RBAC)
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#111215] font-normal">
            Identity & Authentication
          </h2>
          <p className="text-xs text-[#575B66] mt-1">
            Switch between authenticated Teacher and Student profiles with verified data isolation.
          </p>
        </div>

        {/* Current User State (if logged in) */}
        {currentUser && (
          <div className="mb-6 p-4 rounded-2xl bg-[#F0EDE6] border border-[#DDD7CB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentUser.role === 'teacher' ? '🧑‍🏫' : '🧑‍🎓'}</span>
              <div>
                <div className="text-xs font-semibold text-[#111215]">
                  {currentUser.full_name}
                </div>
                <div className="text-[11px] font-mono text-[#7A7E89]">
                  {currentUser.email} • <strong className="uppercase">{currentUser.role}</strong>
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                await onLogout();
                setSuccessNotice('Signed out successfully.');
                setTimeout(() => setSuccessNotice(''), 2000);
              }}
              className="px-3 py-1 text-xs font-mono rounded-full border border-[#B91C1C] text-[#B91C1C] hover:bg-red-50 transition"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-[#DDD7CB] mb-6">
          {[
            { id: 'demo', label: '⚡ 1-Click Demo' },
            { id: 'login', label: 'Sign In' },
            { id: 'signup', label: 'Create Account' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); }}
              className={`pb-2.5 px-4 text-xs font-mono uppercase tracking-wider transition border-b-2 -mb-[1px] ${
                activeTab === tab.id
                  ? 'border-[#111215] text-[#111215] font-bold'
                  : 'border-transparent text-[#7A7E89] hover:text-[#111215]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FDF1EA] border border-[#EAD1A8] text-xs font-mono text-[#B91C1C]">
            ⚠️ {error}
          </div>
        )}
        {successNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
            ✓ {successNotice}
          </div>
        )}

        {/* TAB 1: 1-CLICK DEMO PRESETS */}
        {activeTab === 'demo' && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89] mb-1">
              Select an official verified role preset:
            </span>

            {/* Teacher Preset Card */}
            <button
              disabled={loading}
              onClick={() => handlePresetSelect('prof.euler@nudgepoint.edu', 'PodiumPass123!', 'Prof. Leonhard Euler', 'teacher')}
              className="p-4 rounded-2xl border border-[#DDD7CB] bg-[#F7F4EE] hover:bg-[#F2ECE0] hover:border-[#111215] transition flex items-start gap-4 text-left group"
            >
              <span className="text-3xl p-2 rounded-xl bg-[#EDE8E1] group-hover:scale-105 transition">🧑‍🏫</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-semibold text-[#111215]">
                    Prof. Leonhard Euler
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#111215] text-white font-medium">
                    TEACHER
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#7A7E89] mt-0.5">
                  prof.euler@nudgepoint.edu
                </div>
                <p className="text-[11px] text-[#575B66] mt-1.5 leading-snug">
                  Classroom owner for Room <strong>CALC</strong>. Unlocks real-time aggregate radar telemetry, cognitive friction breakdown, and pedagogical bridge controls.
                </p>
              </div>
            </button>

            {/* Student Preset Card */}
            <button
              disabled={loading}
              onClick={() => handlePresetSelect('alex.rivera@nudgepoint.edu', 'StudentPass123!', 'Alex Rivera', 'student')}
              className="p-4 rounded-2xl border border-[#DDD7CB] bg-[#F7F4EE] hover:bg-[#F2ECE0] hover:border-[#111215] transition flex items-start gap-4 text-left group"
            >
              <span className="text-3xl p-2 rounded-xl bg-[#EDE8E1] group-hover:scale-105 transition">🧑‍🎓</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-semibold text-[#111215]">
                    Alex Rivera
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#DDD7CB] bg-white text-[#111215] font-medium">
                    STUDENT
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[#7A7E89] mt-0.5">
                  alex.rivera@nudgepoint.edu
                </div>
                <p className="text-[11px] text-[#575B66] mt-1.5 leading-snug">
                  Enrolled student in Room <strong>CALC</strong>. Strict peer isolation guarantees signals are private and peer pulses cannot be observed or tampered with.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* TAB 2: SIGN IN */}
        {activeTab === 'login' && (
          <form onSubmit={handleSubmitLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full text-xs font-sans py-2.5 px-3.5 rounded-xl border border-[#DDD7CB] bg-[#FAF8F4] text-[#111215] focus:outline-none focus:border-[#111215]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-sans py-2.5 px-3.5 rounded-xl border border-[#DDD7CB] bg-[#FAF8F4] text-[#111215] focus:outline-none focus:border-[#111215]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-gallery-pill-black w-full !py-2.5 text-xs font-mono mt-2"
            >
              {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
            </button>
          </form>
        )}

        {/* TAB 3: CREATE ACCOUNT */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSubmitSignup} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Ada Lovelace"
                className="w-full text-xs font-sans py-2.5 px-3.5 rounded-xl border border-[#DDD7CB] bg-[#FAF8F4] text-[#111215] focus:outline-none focus:border-[#111215]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@university.edu"
                className="w-full text-xs font-sans py-2.5 px-3.5 rounded-xl border border-[#DDD7CB] bg-[#FAF8F4] text-[#111215] focus:outline-none focus:border-[#111215]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs font-sans py-2.5 px-3.5 rounded-xl border border-[#DDD7CB] bg-[#FAF8F4] text-[#111215] focus:outline-none focus:border-[#111215]"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7A7E89] block mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-1.5 transition ${
                    role === 'student'
                      ? 'bg-[#111215] text-white border-[#111215]'
                      : 'bg-[#FAF8F4] text-[#575B66] border-[#DDD7CB] hover:border-[#111215]'
                  }`}
                >
                  <span>🧑‍🎓</span>
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-1.5 transition ${
                    role === 'teacher'
                      ? 'bg-[#111215] text-white border-[#111215]'
                      : 'bg-[#FAF8F4] text-[#575B66] border-[#DDD7CB] hover:border-[#111215]'
                  }`}
                >
                  <span>🧑‍🏫</span>
                  <span>Teacher</span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-gallery-pill-black w-full !py-2.5 text-xs font-mono mt-2"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT & SIGN IN'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2C. ROLE CHOOSER LANDING SCREEN (Part B Distinct Architectural Split)
// ----------------------------------------------------------------------------
function LoginChooserComponent({ onSelectRole, onBack }) {
  return (
    <div className="min-h-screen bg-[#F3F5F4] text-[#1E262B] flex flex-col font-sans selection:bg-[#1E262B] selection:text-[#F3F5F4]">
      {/* Clean Top Navigation Bar */}
      <header className="border-b border-[#4B555D]/20 bg-[#F3F5F4] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-serif text-2xl font-bold tracking-tight text-[#1E262B]">
            NUDGEPOINT
          </span>
          <button
            onClick={onBack}
            className="text-xs font-sans text-[#4B555D] hover:text-[#1E262B] transition py-1.5 px-3 rounded-lg border border-[#4B555D]/20 hover:border-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none"
          >
            Return to Live Classroom
          </button>
        </div>
      </header>

      {/* Main Role Selection Surface */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 sm:py-16 flex flex-col justify-center">
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="font-cormorant text-4xl sm:text-5xl font-medium tracking-tight text-[#1E262B] leading-tight">
            Enter NudgePoint
          </h1>
          <p className="text-sm font-sans text-[#4B555D] mt-3 max-w-md mx-auto leading-relaxed">
            Select your role to access classroom tools and telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* TEACHER DOOR */}
          <div className="bg-[#FFFFFF] border border-[#4B555D]/20 rounded-2xl p-8 flex flex-col justify-between transition hover:border-[#1E262B]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-sans font-semibold text-[#1E262B] bg-[#F3F5F4] px-2.5 py-1 rounded-md border border-[#4B555D]/20">
                  Instructors & Teaching Assistants
                </span>
                <span className="text-2xl" aria-hidden="true">🧑‍🏫</span>
              </div>
              <h2 className="font-cormorant text-2xl text-[#1E262B] font-medium">
                Teacher Portal
              </h2>
              <p className="text-xs font-sans text-[#4B555D] mt-2 leading-relaxed">
                Lead live sessions with ambient comprehension radar. Track student friction velocity in real time, advance milestones, and deploy targeted pedagogical bridges.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-sans text-[#1E262B]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E262B]"></span>
                  <span>Podium friction radar (90-second sliding window)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E262B]"></span>
                  <span>Projector question moderation & spotlighting</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E262B]"></span>
                  <span>Post-lecture debrief & derailment analytics</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#4B555D]/15">
              <button
                onClick={() => onSelectRole('teacher')}
                className="w-full bg-[#1E262B] text-[#F3F5F4] py-3 px-5 rounded-xl font-sans font-medium text-xs hover:bg-[#383B42] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition shadow-xs"
              >
                Sign In as Instructor
              </button>
            </div>
          </div>

          {/* STUDENT DOOR */}
          <div className="bg-[#FFFFFF] border border-[#4B555D]/20 rounded-2xl p-8 flex flex-col justify-between transition hover:border-[#1D4E89]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-sans font-semibold text-[#1D4E89] bg-[#1D4E89]/10 px-2.5 py-1 rounded-md border border-[#1D4E89]/20">
                  Enrolled Students & Guests
                </span>
                <span className="text-2xl" aria-hidden="true">🧑‍🎓</span>
              </div>
              <h2 className="font-cormorant text-2xl text-[#1E262B] font-medium">
                Student Portal
              </h2>
              <p className="text-xs font-sans text-[#4B555D] mt-2 leading-relaxed">
                Privately communicate when algebra skips a step or lecture pacing accelerates. Your friction signals are aggregated anonymously to keep the room on track.
              </p>
              <ul className="mt-5 space-y-2 text-xs font-sans text-[#1E262B]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D4E89]"></span>
                  <span>Zero peer exposure: pulses are 100% anonymous</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D4E89]"></span>
                  <span>Single-tap friction categories (Step, Pacing, Notation)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1D4E89]"></span>
                  <span>Submit and second lecture questions without raising hand</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#4B555D]/15">
              <button
                onClick={() => onSelectRole('student')}
                className="w-full bg-[#1D4E89] text-[#FFFFFF] py-3 px-5 rounded-xl font-sans font-medium text-xs hover:bg-[#153A66] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition shadow-xs"
              >
                Sign In as Student
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2D. TEACHER LOGIN PORTAL (Structured Lectern Docket + Authentication Desk)
// ----------------------------------------------------------------------------
function TeacherLoginComponent({
  roomCode,
  courseName,
  activeTopic,
  onLoginSuccess,
  onSwitchToStudent,
  onBack,
  onPinUnlock
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await onLoginSuccess(email, password, 'teacher');
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleQuickEuler = async () => {
    setEmail('prof.euler@nudgepoint.edu');
    setPassword('PodiumPass123!');
    setLoading(true);
    setError('');
    const res = await onLoginSuccess('prof.euler@nudgepoint.edu', 'PodiumPass123!', 'teacher');
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    setLoading(true);
    setPinError('');
    const res = await onPinUnlock(pinInput);
    setLoading(false);
    if (!res.success) {
      setPinError(res.error || 'Invalid PIN for room ' + roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F4] text-[#1E262B] flex flex-col font-sans selection:bg-[#1E262B] selection:text-[#F3F5F4]">
      {/* Top Header */}
      <header className="border-b border-[#4B555D]/20 bg-[#F3F5F4] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#1E262B]">
              NUDGEPOINT
            </span>
            <span className="text-xs font-sans text-[#4B555D] border-l border-[#4B555D]/30 pl-3">
              Faculty Lectern
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchToStudent}
              className="text-xs font-sans text-[#1D4E89] hover:underline"
            >
              Switch to Student Portal
            </button>
            <button
              onClick={onBack}
              className="text-xs font-sans text-[#4B555D] hover:text-[#1E262B] transition py-1.5 px-3 rounded-lg border border-[#4B555D]/20 hover:border-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none"
            >
              Return to Session
            </button>
          </div>
        </div>
      </header>

      {/* Two-Column Lectern Docket & Authentication Desk */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-[#4B555D]/20 overflow-hidden shadow-xs">
          
          {/* LEFT COLUMN: Chalkboard Slate Lectern Docket */}
          <div className="md:col-span-5 bg-[#1E262B] text-[#F3F5F4] p-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-sans text-[#F3F5F4]/70 mb-1">
                Room Preparation Docket
              </div>
              <h1 className="font-cormorant text-2xl text-[#FFFFFF] font-medium">
                Lectern Readiness
              </h1>

              <div className="mt-6 pt-5 border-t border-[#4B555D]/40 space-y-4 text-xs">
                <div>
                  <span className="text-[#F3F5F4]/60 block text-[11px]">Assigned Room</span>
                  <span className="font-mono text-base font-semibold text-[#FFFFFF]">{roomCode}</span>
                </div>
                <div>
                  <span className="text-[#F3F5F4]/60 block text-[11px]">Course</span>
                  <span className="font-sans font-medium text-[#FFFFFF]">{courseName}</span>
                </div>
                <div>
                  <span className="text-[#F3F5F4]/60 block text-[11px]">Current Milestone</span>
                  <span className="font-sans text-[#FFFFFF]/90">{activeTopic}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#4B555D]/40 text-xs text-[#F3F5F4]/80 space-y-2">
                <div className="font-sans font-semibold text-[#FFFFFF]">Podium Controls:</div>
                <p className="text-[11px] leading-relaxed text-[#F3F5F4]/70">
                  Signing in verifies ownership of room {roomCode} and activates real-time cognitive radar telemetry.
                </p>
              </div>
            </div>

            {/* Deliberate Bold Element: 1-Click Instructor Preset */}
            <div className="mt-8 pt-6 border-t border-[#4B555D]/40">
              <span className="text-[11px] font-sans text-[#F3F5F4]/70 block mb-2">
                One-Click Verified Demo Access:
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={handleQuickEuler}
                className="w-full bg-[#FFFFFF] text-[#1E262B] hover:bg-[#F3F5F4] transition py-2.5 px-4 rounded-xl text-xs font-sans font-semibold text-left flex items-center justify-between focus:ring-2 focus:ring-[#1D4E89] focus:outline-none"
              >
                <div>
                  <div>Prof. Leonhard Euler</div>
                  <div className="text-[10px] text-[#4B555D] font-mono">Owner of Room {roomCode}</div>
                </div>
                <span className="text-base" aria-hidden="true">🧑‍🏫</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Instructor Authentication Desk */}
          <div className="md:col-span-7 bg-[#FFFFFF] p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="font-cormorant text-3xl font-normal text-[#1E262B]">
                Instructor Access
              </h2>
              <p className="text-xs font-sans text-[#4B555D] mt-1.5">
                Sign in with your verified instructor credentials to manage live classroom telemetry.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-6 p-4 rounded-xl bg-[#FAF3EA] border border-[#9E5A18] text-xs font-sans text-[#9E5A18] flex items-start gap-2.5">
                <span className="text-base shrink-0">⚠️</span>
                <div>
                  <div className="font-semibold">Access Notice</div>
                  <div className="mt-0.5 leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            {!showPinForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E262B] mb-1.5">
                    Faculty Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prof.euler@nudgepoint.edu"
                    className="w-full text-xs font-sans py-3 px-3.5 rounded-xl border border-[#4B555D]/30 bg-[#FFFFFF] text-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E262B] mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs font-sans py-3 px-3.5 rounded-xl border border-[#4B555D]/30 bg-[#FFFFFF] text-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1E262B] text-[#FFFFFF] py-3 px-4 rounded-xl text-xs font-sans font-medium hover:bg-[#383B42] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition disabled:opacity-50 mt-2"
                >
                  {loading ? 'Verifying Faculty Credentials...' : 'Sign In to Podium'}
                </button>

                <div className="pt-4 border-t border-[#4B555D]/15 flex items-center justify-between text-xs text-[#4B555D]">
                  <span>Standing at the physical lectern?</span>
                  <button
                    type="button"
                    onClick={() => setShowPinForm(true)}
                    className="text-[#1D4E89] font-medium hover:underline"
                  >
                    Unlock with Room PIN
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="p-3 bg-[#F3F5F4] rounded-xl border border-[#4B555D]/20 text-xs text-[#4B555D]">
                  Enter the 4-digit instructor PIN displayed on the podium tablet for Room <strong>{roomCode}</strong>.
                </div>

                {pinError && (
                  <div role="alert" className="p-3 rounded-xl bg-[#FAF3EA] border border-[#9E5A18] text-xs font-sans text-[#9E5A18]">
                    {pinError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-sans font-medium text-[#1E262B] mb-1.5">
                    Instructor Room PIN
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Default: 8492"
                    className="w-full text-center tracking-[0.3em] font-mono text-base py-3 px-3.5 rounded-xl border border-[#4B555D]/30 bg-[#FFFFFF] text-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1E262B] text-[#FFFFFF] py-3 px-4 rounded-xl text-xs font-sans font-medium hover:bg-[#383B42] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition disabled:opacity-50"
                >
                  {loading ? 'Checking PIN...' : 'Verify Room Passkey'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowPinForm(false)}
                    className="text-xs font-sans text-[#4B555D] hover:underline"
                  >
                    Return to Email Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2E. STUDENT LOGIN PORTAL (Single-Handed Admission Pass with Peer Privacy)
// ----------------------------------------------------------------------------
function StudentLoginComponent({
  roomCode,
  courseName,
  onLoginSuccess,
  onSwitchToTeacher,
  onGuestJoin,
  onBack
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await onLoginSuccess(email, password, 'student');
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleQuickAlex = async () => {
    setEmail('alex.rivera@nudgepoint.edu');
    setPassword('StudentPass123!');
    setLoading(true);
    setError('');
    const res = await onLoginSuccess('alex.rivera@nudgepoint.edu', 'StudentPass123!', 'student');
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F4] text-[#1E262B] flex flex-col font-sans selection:bg-[#1D4E89] selection:text-[#FFFFFF]">
      {/* Top Header */}
      <header className="border-b border-[#4B555D]/20 bg-[#F3F5F4] px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="font-serif text-2xl font-bold tracking-tight text-[#1E262B]">
            NUDGEPOINT
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchToTeacher}
              className="text-xs font-sans text-[#1D4E89] hover:underline"
            >
              Instructor Portal
            </button>
            <button
              onClick={onBack}
              className="text-xs font-sans text-[#4B555D] hover:text-[#1E262B] transition py-1 px-2.5 rounded-lg border border-[#4B555D]/20 focus:ring-2 focus:ring-[#1D4E89] focus:outline-none"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Pass Card */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8 flex flex-col justify-center">
        <div className="bg-[#FFFFFF] border border-[#4B555D]/20 rounded-2xl overflow-hidden shadow-xs">
          
          {/* DELIBERATE BOLD ELEMENT: Perforated Admission Pass Stub */}
          <div className="p-6 bg-[#FAFBFB] border-b-2 border-dashed border-[#4B555D]/30">
            <div className="flex items-center justify-between text-xs font-mono text-[#4B555D]">
              <span>ADMISSION PASS</span>
              <span>ROOM {roomCode}</span>
            </div>
            <h1 className="font-cormorant text-2xl font-medium text-[#1E262B] mt-1">
              {courseName}
            </h1>

            {/* Prominent Privacy Statement */}
            <div className="mt-3 p-3 rounded-xl bg-[#F3F5F4] border border-[#4B555D]/15 text-xs text-[#4B555D] leading-relaxed flex items-start gap-2">
              <span className="text-base shrink-0 text-[#1D4E89]">🛡️</span>
              <div>
                <strong className="text-[#1E262B] block">Peer Privacy Guarantee:</strong>
                Your identity is never shown to classmates. Friction pulses appear purely as anonymous numbers on the instructor's radar.
              </div>
            </div>
          </div>

          {/* Student Form Body */}
          <div className="p-6 sm:p-8 space-y-4">
            {error && (
              <div role="alert" className="p-3.5 rounded-xl bg-[#FAF3EA] border border-[#9E5A18] text-xs font-sans text-[#9E5A18] flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-sans font-medium text-[#1E262B] mb-1.5">
                  Student Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.rivera@nudgepoint.edu"
                  className="w-full text-xs font-sans py-3 px-3.5 rounded-xl border border-[#4B555D]/30 bg-[#FFFFFF] text-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-[#1E262B] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs font-sans py-3 px-3.5 rounded-xl border border-[#4B555D]/30 bg-[#FFFFFF] text-[#1E262B] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1D4E89] text-[#FFFFFF] py-3 px-4 rounded-xl text-xs font-sans font-medium hover:bg-[#153A66] focus:ring-2 focus:ring-[#1D4E89] focus:outline-none transition disabled:opacity-50 mt-1"
              >
                {loading ? 'Connecting to Room...' : 'Enter Classroom'}
              </button>
            </form>

            {/* 1-Click Demo Alex Rivera */}
            <div className="pt-4 border-t border-[#4B555D]/15">
              <span className="text-[11px] font-sans text-[#4B555D] block mb-2">
                One-Click Enrolled Student Preset:
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={handleQuickAlex}
                className="w-full bg-[#F3F5F4] border border-[#1D4E89]/30 text-[#1D4E89] hover:bg-white transition py-2.5 px-3.5 rounded-xl text-xs font-sans font-semibold text-left flex items-center justify-between focus:ring-2 focus:ring-[#1D4E89] focus:outline-none"
              >
                <div>
                  <div>Alex Rivera</div>
                  <div className="text-[10px] text-[#4B555D] font-mono">Enrolled in Room {roomCode}</div>
                </div>
                <span className="text-base" aria-hidden="true">🧑‍🎓</span>
              </button>
            </div>

            {/* Guest Pass Bypass */}
            <div className="pt-3 text-center border-t border-[#4B555D]/15">
              <button
                type="button"
                onClick={onGuestJoin}
                className="text-xs font-sans text-[#4B555D] hover:text-[#1E262B] underline focus:ring-2 focus:ring-[#1D4E89] focus:outline-none"
              >
                Join as Anonymous Guest (No Account Required)
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2D. CLASS TIMINGS COMPONENT (Schedule, Milestone Timeline & Office Hours)
// ----------------------------------------------------------------------------
function ClassTimingsComponent({ roomCode, courseName, activeTopic, onBackToPulse }) {
  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DDD7CB]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89]">
              SCHEDULE & TIMINGS • ROOM {roomCode}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold animate-pulse">
              ● LIVE SESSION
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111215] tracking-tight">
            Class Timetable & Milestone Schedule
          </h2>
          <p className="text-xs text-[#575B66] mt-0.5">
            {courseName} &nbsp;•&nbsp; Section 04 &nbsp;•&nbsp; Science Center Hall 101
          </p>
        </div>
        {onBackToPulse && (
          <button
            type="button"
            onClick={onBackToPulse}
            className="btn-gallery-pill-black !py-2 !px-4 text-xs font-mono"
          >
            ← Back to Personal Pulse
          </button>
        )}
      </div>

      {/* Live Session Progress Clock Banner */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CB] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#1E262B] text-amber-400 flex items-center justify-center text-xl font-mono shadow-xs">
              ⏱️
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#7A7E89]">
                Today's Lecture Pacing (90-Minute Block)
              </div>
              <div className="text-sm font-semibold text-[#111215]">
                10:00 AM – 11:30 AM EST &nbsp;•&nbsp; <span className="text-emerald-700 font-mono">35 mins elapsed (55 mins remaining)</span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-mono uppercase text-[#7A7E89] block">Current Lecture Milestone:</span>
            <div className="text-xs font-semibold text-[#B45309] font-serif">{activeTopic}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#E5DFD5] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1D4E89] to-[#059669] rounded-full" style={{ width: '39%' }}></div>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-[#7A7E89] mt-2">
          <span>10:00 AM (Start)</span>
          <span className="text-emerald-700 font-semibold">10:18 AM (Conjugates)</span>
          <span>10:45 AM (Trig Chain)</span>
          <span>11:30 AM (Dismissal)</span>
        </div>
      </div>

      {/* Grid: Topic Milestones + Office Hours / Key Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Topic Timeline Breakdown */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89]">
              TODAY'S LECTURE MILESTONES
            </span>
            <span className="text-[10px] font-mono text-[#7A7E89]">5 Topics Planned</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { id: 'm1', time: '10:00 – 10:07', duration: '7 min', title: '1. Review: Slope & Tangent Lines', status: 'completed', desc: 'Recap of secant line limits and algebraic difference quotients.' },
              { id: 'm2', time: '10:07 – 10:18', duration: '11 min', title: '2. Formal Definition of the Derivative', status: 'completed', desc: 'Establishing f\'(x) = lim h→0 [f(x+h) - f(x)]/h.' },
              { id: 'm3', time: '10:18 – 10:31', duration: '13 min', title: '3. Step 3: Algebraic Conjugate Substitution', status: 'active', desc: 'Conjugate expansion [√(x+h) + √x] and eliminating h in denominator.' },
              { id: 'm4', time: '10:31 – 10:45', duration: '14 min', title: '4. Chain Rule with Trigonometric Functions', status: 'upcoming', desc: 'Composing outer derivative with inner rate of change: d/dx[sin(g(x))].' },
              { id: 'm5', time: '10:45 – 11:30', duration: '45 min', title: '5. Real-World Velocity Application & Synthesis', status: 'upcoming', desc: 'Projectile trajectory velocity vectors and open backchannel Q&A.' }
            ].map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border transition ${
                  m.status === 'active'
                    ? 'bg-[#FEF7EE] border-[#EAD1A8] shadow-xs'
                    : m.status === 'completed'
                    ? 'bg-[#FAF8F5] border-[#E5DFD5] opacity-85'
                    : 'bg-[#FAF9F7] border-[#ECE7DE]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                      m.status === 'active'
                        ? 'bg-[#B45309] text-white'
                        : m.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {m.status === 'active' ? '● CURRENT' : m.status === 'completed' ? '✓ DONE' : 'UPCOMING'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#111215]">{m.time}</span>
                    <span className="text-[10px] font-mono text-[#7A7E89]">({m.duration})</span>
                  </div>
                </div>
                <div className="text-xs font-medium text-[#111215] font-serif">{m.title}</div>
                <p className="text-[11px] text-[#575B66] mt-0.5 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: Weekly Recitations, Office Hours, Deadlines */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89]">
            WEEKLY SESSIONS & RECITATIONS
          </span>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] flex flex-col gap-3">
            <div>
              <div className="text-xs font-semibold text-[#111215]">Lectures (3 Days / Week)</div>
              <div className="text-xs text-[#575B66] font-mono mt-0.5">Mon, Wed, Fri • 10:00 AM – 11:30 AM</div>
              <div className="text-[11px] text-[#7A7E89]">Science Center Hall 101 • Room CALC</div>
            </div>
            <div className="border-t border-[#E5DFD5] pt-2.5">
              <div className="text-xs font-semibold text-[#111215]">Prof. Leonhard Euler Office Hours</div>
              <div className="text-xs text-[#575B66] font-mono mt-0.5">Tuesdays & Thursdays • 2:00 PM – 4:00 PM</div>
              <div className="text-[11px] text-[#7A7E89]">Hall 302 or via Zoom by appointment</div>
            </div>
            <div className="border-t border-[#E5DFD5] pt-2.5">
              <div className="text-xs font-semibold text-[#111215]">TA Discussion & Problem Lab</div>
              <div className="text-xs text-[#575B66] font-mono mt-0.5">Wednesdays • 4:30 PM – 6:00 PM</div>
              <div className="text-[11px] text-[#7A7E89]">Math Annex 12</div>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89]">
            UPCOMING EXAMS & DEADLINES
          </span>
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-[#111215]">Problem Set 4</span>
                <span className="block text-[10px] text-[#7A7E89]">Conjugates & Difference Quotients</span>
              </div>
              <span className="font-mono text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Due Friday 11:59 PM</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5DFD5]">
              <div>
                <span className="font-medium text-[#111215]">Midterm Exam 1</span>
                <span className="block text-[10px] text-[#7A7E89]">Units 1 & 2 • In Class</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">Oct 24 • 10:00 AM</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E5DFD5]">
              <div>
                <span className="font-medium text-[#111215]">Midterm Exam 2</span>
                <span className="block text-[10px] text-[#7A7E89]">Units 3 & 4 • In Class</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">Nov 21 • 10:00 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2E. CLASS SYLLABUS COMPONENT (Comprehensive Academic Curriculum & Policies)
// ----------------------------------------------------------------------------
function ClassSyllabusComponent({ roomCode, courseName, onBackToPulse }) {
  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DDD7CB]">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#7A7E89] mb-1">
            OFFICIAL COURSE SYLLABUS • FALL SEMESTER 2026
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111215] tracking-tight">
            {courseName}
          </h2>
          <p className="text-xs text-[#575B66] mt-0.5">
            Section 04 &nbsp;•&nbsp; 4.0 Credit Hours &nbsp;•&nbsp; Instructor: Prof. Leonhard Euler
          </p>
        </div>
        {onBackToPulse && (
          <button
            type="button"
            onClick={onBackToPulse}
            className="btn-gallery-pill-black !py-2 !px-4 text-xs font-mono"
          >
            ← Back to Personal Pulse
          </button>
        )}
      </div>

      {/* Course Overview & Objectives */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CB]">
        <h3 className="font-serif text-lg font-semibold text-[#111215] mb-2">
          Course Description & Scope
        </h3>
        <p className="text-xs text-[#383B42] leading-relaxed mb-3">
          This course develops the mathematical principles of differential, integral, and vector calculus in three and higher dimensional spaces. Key concepts include vector-valued functions, space curves, partial differentiation, directional derivatives, gradient vector fields, multiple integrals in Cartesian, cylindrical, and spherical coordinates, line and surface integrals, and culminating in Green’s Theorem, Stokes’ Theorem, and the Divergence Theorem.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E5DFD5] text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#7A7E89] block">PREREQUISITE</span>
            <span className="font-medium text-[#111215]">MATH 102 (Single-Var Calc, C or higher)</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#7A7E89] block">TEXTBOOK</span>
            <span className="font-medium text-[#111215]">Stewart Calculus (9th Edition)</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-[#7A7E89] block">LIVE PULSE PORTAL</span>
            <span className="font-medium text-[#111215]">NudgePoint Room: {roomCode}</span>
          </div>
        </div>
      </div>

      {/* 15-Week Curriculum Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89]">
            15-WEEK CURRICULAR BREAKDOWN
          </span>
          <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
            Currently in Week 4: Unit 2
          </span>
        </div>

        <div className="space-y-3">
          {[
            {
              unit: 'Unit 1: Vectors & The Geometry of Space',
              weeks: 'Weeks 1–3',
              status: 'completed',
              topics: '3D coordinate systems, vector arithmetic, dot and cross products, equations of lines and planes, quadric surfaces.'
            },
            {
              unit: 'Unit 2: Vector Functions & Differential Calculus',
              weeks: 'Weeks 4–6',
              status: 'current',
              topics: 'Vector functions and space curves, derivatives and integrals of vector functions, arc length and curvature, limits, algebraic conjugate substitutions, multivariable chain rule.'
            },
            {
              unit: 'Unit 3: Partial Derivatives & Multivariable Optimization',
              weeks: 'Weeks 7–9',
              status: 'upcoming',
              topics: 'Functions of several variables, limits and continuity in R^n, partial derivatives, tangent planes and linear approximations, directional derivatives, gradient vectors, maximum and minimum values, Lagrange multipliers.'
            },
            {
              unit: 'Unit 4: Multiple Integrals & Coordinate Systems',
              weeks: 'Weeks 10–12',
              status: 'upcoming',
              topics: 'Double integrals over general regions, polar coordinate transformations, surface area, triple integrals in cylindrical and spherical coordinates, Jacobian change of variables.'
            },
            {
              unit: 'Unit 5: Vector Calculus & Field Theorems',
              weeks: 'Weeks 13–15',
              status: 'upcoming',
              topics: 'Vector fields, line integrals, Fundamental Theorem of Line Integrals, Green’s Theorem, curl and divergence, surface integrals, Stokes’ Theorem, Divergence Theorem.'
            }
          ].map((u, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition ${
                u.status === 'current'
                  ? 'bg-[#FEF7EE] border-[#EAD1A8] shadow-xs'
                  : 'bg-[#FAF8F5] border-[#DDD7CB]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                    u.status === 'current'
                      ? 'bg-[#B45309] text-white'
                      : u.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {u.status === 'current' ? 'CURRENT UNIT' : u.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                  </span>
                  <span className="font-serif text-sm font-semibold text-[#111215]">{u.unit}</span>
                </div>
                <span className="text-[10px] font-mono text-[#7A7E89]">{u.weeks}</span>
              </div>
              <p className="text-xs text-[#575B66] mt-1 leading-relaxed">{u.topics}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grading Scheme & Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CB]">
          <h4 className="font-serif text-base font-semibold text-[#111215] mb-3">
            Assessment & Grading Weights
          </h4>
          <div className="space-y-2">
            {[
              { component: 'Weekly Problem Sets', weight: '25%', note: 'Due Fridays 11:59 PM (Lowest dropped)' },
              { component: 'Midterm Examination 1', weight: '20%', note: 'Covers Units 1–2 (Week 7)' },
              { component: 'Midterm Examination 2', weight: '20%', note: 'Covers Units 3–4 (Week 12)' },
              { component: 'Comprehensive Final Exam', weight: '25%', note: 'Cumulative university scheduled' },
              { component: 'In-Class Pulse Participation', weight: '10%', note: 'Active NudgePoint friction feedback' },
            ].map((g, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#E5DFD5] last:border-0">
                <div>
                  <span className="font-medium text-[#111215]">{g.component}</span>
                  <span className="block text-[10px] text-[#7A7E89]">{g.note}</span>
                </div>
                <span className="font-mono font-bold text-xs text-[#1D4E89]">{g.weight}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CB] flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-base font-semibold text-[#111215] mb-2">
              Classroom Dignity & Policies
            </h4>
            <ul className="text-xs text-[#575B66] space-y-2 list-disc list-inside leading-relaxed">
              <li><strong>Zero-Stigma Feedback:</strong> NudgePoint friction pulses are completely anonymous to peers. Use signals freely whenever derivations feel fast or unclear.</li>
              <li><strong>Collaboration:</strong> Concept discussions are celebrated. However, all homework submissions must be transcribed individually.</li>
              <li><strong>Late Submissions:</strong> Up to 24 hours late with 10% deduction; beyond 24 hours requires dean approval.</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E5DFD5] text-[10px] font-mono text-[#7A7E89]">
            Questions? Email Prof. Euler at <span className="underline font-semibold">prof.euler@nudgepoint.edu</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. MAIN APPLICATION ROOT
// ----------------------------------------------------------------------------
function NudgePointApp() {
  const parseRoute = () => {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    const pathname = window.location.pathname ? window.location.pathname.replace(/^\//, '') : '';
    const target = rawHash || pathname;

    let view = 'studio';
    let code = 'CALC';

    if (target.startsWith('login/teacher') || target.startsWith('view=login-teacher')) {
      view = 'login-teacher';
    } else if (target.startsWith('login/student') || target.startsWith('view=login-student')) {
      view = 'login-student';
    } else if (target.startsWith('login') || target.startsWith('view=login')) {
      view = 'login-chooser';
    } else {
      const params = new URLSearchParams(rawHash.includes('?') ? rawHash.split('?')[1] : (rawHash.includes('&') ? rawHash : ''));
      if (params.get('view')) view = params.get('view');
      else if (rawHash.includes('timings') || target.startsWith('timings')) view = 'timings';
      else if (rawHash.includes('syllabus') || target.startsWith('syllabus')) view = 'syllabus';
      else if (rawHash.includes('student') || target.startsWith('student')) view = 'student';
      else if (rawHash.includes('podium') || target.startsWith('podium')) view = 'podium';
      else if (rawHash.includes('stage') || target.startsWith('stage')) view = 'stage';
      else if (rawHash.includes('analytics') || target.startsWith('analytics')) view = 'analytics';

      if (params.get('room')) code = params.get('room').toUpperCase();
    }

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
  const [showFlightSim] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(15); // % friction to trigger amber alert


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
    } catch (e) {
      // Best-effort token initialization; falls back to 's1' if window/location is inaccessible
    }
    return 's1';
  });

  const [studentNotes, setStudentNotes] = useState([
    { time: '10:18', topic: '2. Formal Definition of the Derivative', tag: 'Pacing Too Fast' }
  ]);

  // Priority 1 & 3: Multi-device WebSocket Transport and RBAC Auth State
  const [authToken, setAuthToken] = useState(() => {
    try { return localStorage.getItem('np_auth_token') || null; } catch (e) { return null; }
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('np_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Teacher PIN state (legacy fallback for quick room passkey entry)
  const [teacherPin, setTeacherPin] = useState(() => {
    try { return localStorage.getItem('np_teacher_pin') || '8492'; } catch (e) { return '8492'; }
  });
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(() => {
    try {
      if (localStorage.getItem('np_user')) {
        const u = JSON.parse(localStorage.getItem('np_user'));
        if (u && u.role === 'teacher') return true;
      }
      return !!localStorage.getItem('np_teacher_pin');
    } catch (e) { return false; }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [serverNotice, setServerNotice] = useState(null);

  const isTeacherUser = (currentUser && currentUser.role === 'teacher') || (!currentUser && isTeacherAuthenticated);
  const isStudentRole = (currentUser && currentUser.role === 'student') || activeView === 'student' || activeView === 'timings' || activeView === 'syllabus';

  // Authenticate / refresh user session on load
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'teacher') {
            setIsTeacherAuthenticated(true);
          }
          try { localStorage.setItem('np_user', JSON.stringify(data.user)); } catch (e) {}
        } else {
          setAuthToken(null);
          setCurrentUser(null);
          try {
            localStorage.removeItem('np_auth_token');
            localStorage.removeItem('np_user');
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, [authToken]);

  const loginUser = async (email, password, expectedRole = null) => {
    try {
      const payload = { email, password };
      if (expectedRole) payload.expectedRole = expectedRole;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setAuthToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role === 'teacher') {
        setIsTeacherAuthenticated(true);
      }
      try {
        localStorage.setItem('np_auth_token', data.token);
        localStorage.setItem('np_user', JSON.stringify(data.user));
      } catch (e) {}
      setPinError('');
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signupUser = async (email, password, fullName, role) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      setAuthToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role === 'teacher') {
        setIsTeacherAuthenticated(true);
      }
      try {
        localStorage.setItem('np_auth_token', data.token);
        localStorage.setItem('np_user', JSON.stringify(data.user));
      } catch (e) {}
      setPinError('');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logoutUser = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
      } catch (e) {}
    }
    setAuthToken(null);
    setCurrentUser(null);
    setIsTeacherAuthenticated(false);
    try {
      localStorage.removeItem('np_auth_token');
      localStorage.removeItem('np_user');
      localStorage.removeItem('np_teacher_pin');
    } catch (e) {}
  };

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
          const effectiveRole = (currentUser && currentUser.role === 'teacher') || activeView === 'podium' ? 'podium' : 'student';
          ws.send(JSON.stringify({
            type: 'JOIN',
            room: roomCode,
            role: effectiveRole,
            token: authToken,
            pin: teacherPin,
            studentId: currentUser ? currentUser.id : studentToken
          }));
        };

        ws.onmessage = (e) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'INIT_STATE' && msg.data) {
              if (Array.isArray(msg.data.pulses)) {
                setPulses(msg.data.pulses);
              } else if (msg.data.myPulse) {
                setPulses([{ ...msg.data.myPulse, isMine: true }]);
              } else if (currentUser && currentUser.role === 'student') {
                setPulses([]);
              }
              if (Array.isArray(msg.data.questions)) setQuestions(msg.data.questions);
              if (Array.isArray(msg.data.interventions)) setInterventions(msg.data.interventions);
              if (msg.data.activeTopic) setActiveTopic(msg.data.activeTopic);
            } else if (msg.type === 'PULSE') {
              const pData = msg.data;
              setPulses((prev) => {
                if (prev.some((p) => p.id === pData.id)) return prev;
                return [...prev, pData];
              });
            } else if (msg.type === 'RESOLVE') {
              if (msg.data && msg.data.studentId) {
                setPulses((prev) => prev.filter((p) => p.studentId !== msg.data.studentId));
              } else {
                const targetId = currentUser ? currentUser.id : studentToken;
                setPulses((prev) => prev.filter((p) => !p.isMine && p.studentId !== targetId));
              }
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
          } catch (parseErr) {
            console.warn('[NudgePoint] Malformed WebSocket message payload:', e.data, parseErr);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setSocketConnected(false);
          reconnectTimeout = setTimeout(initSocket, 2500);
        };

        ws.onerror = () => {
          // Best-effort cleanup of errored socket before reconnect
          try { ws.close(); } catch (err) {}
        };

        wsRef.current = ws;
      } catch (err) {
        console.warn('[NudgePoint] WebSocket initialization failed, retrying in 3s:', err);
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
    } catch (e) {
      // Best-effort local sync; silently fallback if BroadcastChannel is restricted (e.g. sandbox iframe)
    }

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
  }, [roomCode, teacherPin, activeView, authToken]);

  const broadcast = (type, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type, room: roomCode, data }));
      } catch (e) {
        console.warn('[NudgePoint] Failed to send WebSocket frame:', type, e);
      }
    }
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({ type, data });
      } catch (e) {}
    }
  };

  const verifyTeacherPinDirect = async (pin) => {
    const cleanPin = (pin || '').trim();
    if (!cleanPin) return { success: false, error: 'Please enter the 4-digit teacher passkey.' };
    try {
      const res = await fetch('/api/rooms/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomCode, pin: cleanPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token && data.user) {
          setAuthToken(data.token);
          setCurrentUser(data.user);
          try {
            localStorage.setItem('np_auth_token', data.token);
            localStorage.setItem('np_user', JSON.stringify(data.user));
          } catch (e) {}
        }
        try { localStorage.setItem('np_teacher_pin', cleanPin); } catch (e) {}
        setTeacherPin(cleanPin);
        setIsTeacherAuthenticated(true);
        setPinError('');
        return { success: true };
      } else {
        return { success: false, error: 'Invalid Teacher PIN. (Default Room CALC PIN is 8492)' };
      }
    } catch (err) {
      if (cleanPin === teacherPin || cleanPin === '8492') {
        try { localStorage.setItem('np_teacher_pin', cleanPin); } catch (e) {}
        setTeacherPin(cleanPin);
        setIsTeacherAuthenticated(true);
        setPinError('');
        return { success: true };
      }
      return { success: false, error: 'Invalid Teacher PIN. (Default Room CALC PIN is 8492)' };
    }
  };

  const handleVerifyTeacherPin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const res = await verifyTeacherPinDirect(pinInput);
    if (!res.success) setPinError(res.error);
  };

  const handleLogoutTeacher = () => {
    logoutUser();
    setPinInput('');
  };

  useEffect(() => {
    acoustic.muted = !soundEnabled;
  }, [soundEnabled]);

  const now = Date.now();
  const windowCutoff = now - windowDurationSec * 1000;
  const activePulses = useMemo(() => pulses.filter((p) => p.timestamp >= windowCutoff), [pulses, windowCutoff]);

  const activeStudentPulse = useMemo(() => {
    const targetId = currentUser ? currentUser.id : studentToken;
    return activePulses.find((p) => p.studentId === targetId || p.isMine) || null;
  }, [activePulses, studentToken, currentUser]);

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
    if (frictionRate >= alertThreshold * 2) {
      return { level: 'red', label: 'Derailment Risk', icon: '🔴', color: '#C84B42', pulseClass: 'red-pulse-active' };
    }
    if (frictionRate >= alertThreshold) {
      return { level: 'amber', label: 'Amber Pulse Active', icon: '🟡', color: '#C4761E', pulseClass: 'amber-pulse-active' };
    }
    return { level: 'neutral', label: 'Classroom in Flow', icon: '🟢', color: '#2B7A4B', pulseClass: '' };
  }, [frictionRate, alertThreshold]);

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

    const targetId = currentUser ? currentUser.id : studentToken;
    const pulse = {
      id: 'p_' + Date.now() + '_' + targetId,
      studentId: targetId,
      timestamp: Date.now(),
      tag: tagId,
      topic: activeTopic,
    };

    setPulses((prev) => {
      const filtered = prev.filter((p) => p.studentId !== targetId && !p.isMine);
      return [...filtered, { ...pulse, isMine: true }];
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
    const targetId = currentUser ? currentUser.id : studentToken;
    setPulses((prev) => prev.filter((p) => p.studentId !== targetId && !p.isMine));
    broadcast('RESOLVE', { studentId: targetId });
  };

  const handleDeployBridge = (title) => {
    acoustic.playTap();
    setInterventions((prev) => [
      { id: 'i_' + Date.now(), title, timestamp: Date.now(), topic: activeTopic },
      ...prev
    ]);
  };

  const [simFilter, setSimFilter] = useState('all');

  // Scenario 1: The Algebraic Leap (Skips line 2.5 conjugate cancel) -> Derails 11 students
  const simAlgebraicLeap = () => {
    if (!isTeacherUser) return;
    acoustic.playPulseChime();
    const targets = students.filter(s => s.role === 'Shy' || (s.role === 'Note Copier' && ['C1','C2','C3','C4'].includes(s.seat)));
    const newItems = targets.map((s, idx) => ({
      id: 'sim_leap_' + Date.now() + '_' + idx,
      studentId: s.id,
      timestamp: Date.now() - Math.random() * 14000,
      tag: 'step',
      topic: activeTopic,
    }));
    newItems.forEach(p => broadcast('PULSE', p));
    setPulses(prev => {
      const existing = new Set(prev.map(p => p.studentId));
      return [...prev, ...newItems.filter(p => !existing.has(p.studentId))];
    });
  };

  // Scenario 2: Pacing Sprint (Slide flipped before notes copied) -> Derails 7 Note Copiers
  const simPacingSprint = () => {
    if (!isTeacherUser) return;
    acoustic.playPulseChime();
    const targets = students.filter(s => s.role === 'Note Copier');
    const newItems = targets.map((s, idx) => ({
      id: 'sim_pace_' + Date.now() + '_' + idx,
      studentId: s.id,
      timestamp: Date.now() - Math.random() * 9000,
      tag: 'pace',
      topic: activeTopic,
    }));
    newItems.forEach(p => broadcast('PULSE', p));
    setPulses(prev => {
      const existing = new Set(prev.map(p => p.studentId));
      return [...prev, ...newItems.filter(p => !existing.has(p.studentId))];
    });
  };

  // Scenario 3: Notation Ambiguity (Differential operator d/dx ambiguity) -> Derails 5 students
  const simNotationAmbiguity = () => {
    if (!isTeacherUser) return;
    acoustic.playPulseChime();
    const targets = students.filter(s => ['s1', 's2', 's10', 's13', 's18'].includes(s.id));
    const newItems = targets.map((s, idx) => ({
      id: 'sim_not_' + Date.now() + '_' + idx,
      studentId: s.id,
      timestamp: Date.now() - Math.random() * 8000,
      tag: 'notation',
      topic: activeTopic,
    }));
    newItems.forEach(p => broadcast('PULSE', p));
    setPulses(prev => {
      const existing = new Set(prev.map(p => p.studentId));
      return [...prev, ...newItems.filter(p => !existing.has(p.studentId))];
    });
  };

  // Scenario 4: Socratic Recovery Cascade (Comprehension wave cascades across room)
  const simCascadeRecovery = () => {
    if (!isTeacherUser) return;
    acoustic.playResolve();
    if (typeof window !== 'undefined' && window.confetti) {
      try {
        window.confetti({ particleCount: 50, spread: 75, origin: { y: 0.85 } });
      } catch (e) {
        // Optional celebration effect; safely ignore if canvas-confetti throws
      }
    }
    const rows = ['rowA', 'rowB', 'rowC', 'rowD', 'rowE'];
    rows.forEach((rId, i) => {
      setTimeout(() => {
        setPulses(prev => {
          const rowIds = new Set(students.filter(s => s.rowId === rId).map(s => s.id));
          rowIds.forEach(stId => broadcast('RESOLVE', { studentId: stId }));
          return prev.filter(p => !rowIds.has(p.studentId));
        });
      }, (i + 1) * 220);
    });
  };

  // Scenario 5: Full Reset
  const simResetAll = () => {
    if (!isTeacherUser) return;
    acoustic.playTap();
    students.forEach(s => broadcast('RESOLVE', { studentId: s.id }));
    setPulses([]);
  };

  if (activeView === 'login-chooser') {
    return (
      <LoginChooserComponent
        onSelectRole={(role) => {
          window.location.hash = `#/login/${role}`;
          setActiveView(`login-${role}`);
        }}
        onBack={() => {
          window.location.hash = '#view=studio';
          setActiveView('studio');
        }}
      />
    );
  }

  if (activeView === 'login-teacher') {
    return (
      <TeacherLoginComponent
        roomCode={roomCode}
        courseName={courseName}
        activeTopic={activeTopic}
        onLoginSuccess={async (email, password, role) => {
          const res = await loginUser(email, password, role);
          if (res.success) {
            window.location.hash = '#view=podium';
            setActiveView('podium');
          }
          return res;
        }}
        onSwitchToStudent={() => {
          window.location.hash = '#/login/student';
          setActiveView('login-student');
        }}
        onBack={() => {
          window.location.hash = '#view=studio';
          setActiveView('studio');
        }}
        onPinUnlock={async (pin) => {
          const res = await verifyTeacherPinDirect(pin);
          if (res.success) {
            window.location.hash = '#view=podium';
            setActiveView('podium');
          }
          return res;
        }}
      />
    );
  }

  if (activeView === 'login-student') {
    return (
      <StudentLoginComponent
        roomCode={roomCode}
        courseName={courseName}
        onLoginSuccess={async (email, password, role) => {
          const res = await loginUser(email, password, role);
          if (res.success) {
            window.location.hash = '#view=student';
            setActiveView('student');
          }
          return res;
        }}
        onSwitchToTeacher={() => {
          window.location.hash = '#/login/teacher';
          setActiveView('login-teacher');
        }}
        onGuestJoin={() => {
          window.location.hash = '#view=student';
          setActiveView('student');
        }}
        onBack={() => {
          window.location.hash = '#view=studio';
          setActiveView('studio');
        }}
      />
    );
  }

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
              onClick={() => {
                const targetView = (currentUser && currentUser.role === 'student') ? 'student' : 'studio';
                window.location.hash = `#view=${targetView}`;
                setActiveView(targetView);
              }}
              className="font-serif text-2xl font-bold tracking-tight text-[#111215] cursor-pointer hover:opacity-80 transition"
            >
              NUDGEPOINT
            </span>
          </div>

          {/* Centered Spaced-out Nav Links */}
          <nav className="hidden md:flex items-center gap-8 gallery-nav">
            {(currentUser && currentUser.role === 'student'
              ? [
                  { id: 'student', label: 'STUDENT PULSE' },
                  { id: 'timings', label: 'CLASS TIMINGS' },
                  { id: 'syllabus', label: 'SYLLABUS' },
                ]
              : [
                  { id: 'studio', label: 'STUDIO' },
                  { id: 'podium', label: 'PODIUM' },
                  { id: 'student', label: 'STUDENT' },
                  { id: 'timings', label: 'TIMINGS' },
                  { id: 'syllabus', label: 'SYLLABUS' },
                  { id: 'stage', label: 'STAGE' },
                  { id: 'analytics', label: 'HEATMAP' },
                ]
            ).map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  window.location.hash = `#view=${link.id}`;
                  setActiveView(link.id);
                }}
                className={`gallery-nav-btn ${activeView === link.id ? 'active' : ''}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Button (Pill) & User Role Status */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gallery-nav-btn hidden sm:inline-flex"
            >
              {soundEnabled ? 'AUDIO: ON' : 'AUDIO: OFF'}
            </button>
            <div className="rounded-full px-4 py-2 border border-[#CBC4B5] bg-[#F1EDE5] text-[11px] font-mono tracking-[0.18em] uppercase text-[#111215] font-medium shadow-xs whitespace-nowrap shrink-0">
              ROOM: {roomCode}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="rounded-full px-3.5 py-1.5 border border-[#111215] bg-[#111215] text-[#FAF8F4] text-[11px] font-sans font-medium hover:bg-[#383B42] transition flex items-center gap-1.5 shadow-xs shrink-0"
                  title="Account Settings & Role Switcher"
                >
                  <span>{currentUser.role === 'teacher' ? '🧑‍🏫' : '🧑‍🎓'}</span>
                  <span className="hidden sm:inline font-medium">{currentUser.full_name.split(' ')[0]}</span>
                  <span className="text-[9px] font-mono uppercase opacity-75">[{currentUser.role}]</span>
                </button>
                <button
                  onClick={logoutUser}
                  className="text-[10px] font-mono text-[#7A7E89] hover:text-[#111215] underline hidden lg:inline"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  window.location.hash = '#/login';
                  setActiveView('login-chooser');
                }}
                className="btn-gallery-pill-black !py-1.5 !px-3.5 text-[10px] font-mono tracking-wider shrink-0"
              >
                🔑 SIGN IN
              </button>
            )}
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
            {currentUser && currentUser.role === 'student' ? (
              <>
                <button
                  onClick={() => {
                    window.location.hash = '#view=student';
                    setActiveView('student');
                  }}
                  className="btn-gallery-pill-black"
                >
                  MY STUDENT PULSE
                </button>
                <button
                  onClick={() => {
                    window.location.hash = '#view=timings';
                    setActiveView('timings');
                  }}
                  className="btn-gallery-pill-outline"
                >
                  CLASS TIMINGS
                </button>
                <button
                  onClick={() => {
                    window.location.hash = '#view=syllabus';
                    setActiveView('syllabus');
                  }}
                  className="btn-gallery-pill-outline"
                >
                  COURSE SYLLABUS
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    window.location.hash = '#view=podium';
                    setActiveView('podium');
                  }}
                  className="btn-gallery-pill-black"
                >
                  EXPLORE PODIUM
                </button>
                <button
                  onClick={() => {
                    window.location.hash = '#view=student';
                    setActiveView('student');
                  }}
                  className="btn-gallery-pill-outline"
                >
                  JOIN AS STUDENT
                </button>
              </>
            )}
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
            {isTeacherUser && !isStudentRole && (
              <button
                onClick={simCascadeRecovery}
                className="tracking-[0.14em] uppercase font-semibold text-[#B45309] hover:text-[#78350F] underline underline-offset-4 transition"
              >
                RESOLVE ALL →
              </button>
            )}
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
                onMarkAnswered={(id) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true } : q))}
                onToggleProject={(id) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, projected: !q.projected } : q))}
                alertThreshold={alertThreshold}
                onAlertThresholdChange={setAlertThreshold}
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
                  {currentUser ? `🧑‍🎓 ${currentUser.full_name}` : studentToken === 's1' ? 'SEAT E1 • MARCUS CHEN' : 'ANONYMOUS'}
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
                  currentUser={currentUser}
                  onOpenAuth={() => { window.location.hash = '#/login/student'; setActiveView('login-student'); }}
                  onQuickStudentLogin={() => loginUser('alex.rivera@nudgepoint.edu', 'StudentPass123!', 'student')}
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

        {/* VIEW 2: DEDICATED TEACHER PODIUM (Role-Gated with RBAC & Teacher PIN) */}
        {activeView === 'podium' && (
          !((currentUser && currentUser.role === 'teacher') || isTeacherAuthenticated) ? (
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
                    Live classroom telemetry and pedagogical bridge controls are reserved for instructors.
                  </p>
                </div>

                {/* 1-Click Instant Instructor Sign-in */}
                <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#DDD7CB] flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A7E89]">
                    ⚡ Verified Room Owner
                  </span>
                  <button
                    type="button"
                    onClick={() => loginUser('prof.euler@nudgepoint.edu', 'PodiumPass123!')}
                    className="btn-gallery-pill-black w-full !py-2.5 text-xs font-mono flex items-center justify-center gap-2"
                  >
                    <span>🧑‍🏫</span>
                    <span>Sign In as Prof. Euler</span>
                  </button>
                  <span className="text-[10px] text-[#7A7E89]">
                    Owns Room CALC • Full Telemetry Access
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-[#DDD7CB] flex-1"></div>
                  <span className="text-[10px] font-mono uppercase text-[#7A7E89]">OR PASSKEY</span>
                  <div className="h-px bg-[#DDD7CB] flex-1"></div>
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
                    className="btn-gallery-pill-outline w-full"
                  >
                    AUTHENTICATE WITH PIN
                  </button>
                </form>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.hash = '#/login/teacher';
                      setActiveView('login-teacher');
                    }}
                    className="text-xs font-mono text-[#111215] hover:underline"
                  >
                    Teacher Login Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('student')}
                    className="text-xs font-mono text-[#575B66] hover:text-[#111215] underline"
                  >
                    ← Return to Student View
                  </button>
                </div>
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
                  <div className="text-xs text-[#575B66] mt-0.5 flex items-center gap-1.5">
                    <span>Instructor:</span>
                    <strong className="text-[#111215]">{currentUser ? currentUser.full_name : 'Prof. Leonhard Euler'}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${
                    socketConnected ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'
                  }`}>
                    {socketConnected ? '🟢 Live WebSocket' : '🟠 Local Sync'}
                  </span>
                  <button
                    onClick={logoutUser}
                    className="text-[10px] font-mono text-[#7A7E89] hover:text-[#111215] underline"
                  >
                    Sign Out 🔒
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
                onMarkAnswered={(id) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answered: true } : q))}
                onToggleProject={(id) => {
                  const q = questions.find((item) => item.id === id);
                  const nextVal = q ? !q.projected : true;
                  setQuestions((prev) => prev.map((item) => item.id === id ? { ...item, projected: nextVal } : item));
                  broadcast('PROJECT_QUESTION', { id, projected: nextVal });
                }}
                alertThreshold={alertThreshold}
                onAlertThresholdChange={setAlertThreshold}
              />
            </div>
          )
        )}

        {/* VIEW 3: DEDICATED STUDENT VIEW */}
        {activeView === 'student' && (
          <div className="max-w-4xl mx-auto w-full py-6">
            <div className="gallery-panel p-6 sm:p-8 flex flex-col justify-between min-h-[620px]">
              <GalleryStudentComponent
                roomCode={roomCode}
                courseName={courseName}
                activeTopic={activeTopic}
                activeStudentPulse={activeStudentPulse}
                studentToken={studentToken}
                currentUser={currentUser}
                onOpenAuth={() => { window.location.hash = '#/login/student'; setActiveView('login-student'); }}
                onQuickStudentLogin={() => loginUser('alex.rivera@nudgepoint.edu', 'StudentPass123!', 'student')}
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

        {/* VIEW 3B: STANDALONE CLASS TIMINGS */}
        {activeView === 'timings' && (
          <div className="max-w-4xl mx-auto w-full py-6">
            <div className="gallery-panel p-6 sm:p-8">
              <ClassTimingsComponent
                roomCode={roomCode}
                courseName={courseName}
                activeTopic={activeTopic}
                onBackToPulse={() => {
                  window.location.hash = '#view=student';
                  setActiveView('student');
                }}
              />
            </div>
          </div>
        )}

        {/* VIEW 3C: STANDALONE CLASS SYLLABUS */}
        {activeView === 'syllabus' && (
          <div className="max-w-4xl mx-auto w-full py-6">
            <div className="gallery-panel p-6 sm:p-8">
              <ClassSyllabusComponent
                roomCode={roomCode}
                courseName={courseName}
                onBackToPulse={() => {
                  window.location.hash = '#view=student';
                  setActiveView('student');
                }}
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
            authToken={authToken}
            currentUser={currentUser}
            onOpenAuth={() => { window.location.hash = '#/login/teacher'; setActiveView('login-teacher'); }}
          />
        )}

        {/* SIMULATION CONSOLE (IMMERSIVE LECTURE HALL AMPHITHEATER RADAR) */}
        {showFlightSim && isTeacherUser && !isStudentRole && (
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

                            if (!isTeacherUser) {
                              return (
                                <div
                                  key={st.id}
                                  className={`hall-seat-card read-only cursor-default ${isLost ? 'is-lost' : 'is-flow'}`}
                                  title={`${st.name} [Seat ${st.seat}] (${st.role}) — Student presence (Read-Only)`}
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
                                </div>
                              );
                            }

                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  acoustic.playTap();
                                  if (isLost) {
                                    setPulses(prev => prev.filter(p => p.studentId !== st.id));
                                    broadcast('RESOLVE', { studentId: st.id });
                                  } else {
                                    const p = {
                                      id: 'p_' + Date.now() + '_' + st.id,
                                      studentId: st.id,
                                      timestamp: Date.now(),
                                      tag: st.role === 'Note Copier' ? 'pace' : 'step',
                                      topic: activeTopic
                                    };
                                    setPulses(prev => [...prev, p]);
                                    broadcast('PULSE', p);
                                  }
                                }}
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

      {/* 6. RBAC AUTHENTICATION & DEMO SWITCHER MODAL */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={loginUser}
        onSignup={signupUser}
        currentUser={currentUser}
        onLogout={logoutUser}
      />

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
  onMarkAnswered,
  onToggleProject,
  alertThreshold,
  onAlertThresholdChange,
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

        {/* Alert Threshold Control */}
        <div className="pt-4 border-t border-[#EAE6DF] flex flex-wrap items-center gap-4">
          <label htmlFor="alert-threshold-slider" className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#7A7E89] shrink-0">
            Alert Threshold
          </label>
          <input
            id="alert-threshold-slider"
            type="range"
            min={5}
            max={40}
            step={5}
            value={alertThreshold}
            onChange={(e) => onAlertThresholdChange(Number(e.target.value))}
            className="flex-1 min-w-[120px] accent-[#C4761E] cursor-pointer"
            aria-label={`Alert threshold: ${alertThreshold}% for amber, ${alertThreshold * 2}% for red`}
          />
          <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
            <span className="text-[#C4761E] font-semibold">🟡 {alertThreshold}%</span>
            <span className="text-[#C84B42] font-semibold">🔴 {alertThreshold * 2}%</span>
          </div>
        </div>
      </div>

      {/* 2. SUB NAVIGATION PILLS */}
      <div className="subnav-bar" role="tablist" aria-label="Podium dashboard sections">
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
            role="tab"
            aria-selected={activeSubTab === sTab.id}
            aria-controls={`panel-${sTab.id}`}
            id={`tab-${sTab.id}`}
          >
            {sTab.label}
          </button>
        ))}
      </div>

      {/* 3. MILESTONES TAB */}
      {activeSubTab === 'radar' && (
        <div className="gallery-panel p-6 flex flex-col gap-3" role="tabpanel" id="panel-radar" aria-labelledby="tab-radar">
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
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTopic(t.title); } }}
                  className={`milestone-item ${isActive ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={`Select milestone: ${t.title} at ${t.timestamp}`}
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
  currentUser,
  onOpenAuth,
  onQuickStudentLogin,
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
              {currentUser ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  🧑‍🎓 {currentUser.full_name}
                </span>
              ) : studentToken === 's1' ? (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#FDF1EA] text-[#B25828] border border-[#EAD1A8]">
                  SEAT E1 • SHY
                </span>
              ) : null}
            </div>
            <div className="font-serif text-sm font-semibold text-[#111215] truncate" title={courseName}>
              {courseName}
            </div>
            {!currentUser && onQuickStudentLogin && (
              <div className="mt-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onQuickStudentLogin}
                  className="text-[10px] font-mono text-[#C4761E] hover:underline"
                >
                  ⚡ Join as Alex Rivera
                </button>
                <span className="text-[#DDD7CB]">•</span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-[10px] font-mono text-[#7A7E89] hover:text-[#111215] underline"
                >
                  Sign In
                </button>
              </div>
            )}
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

        {/* Navigation Sub-Tabs */}
        <div className="mt-3 flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF8F5] border border-[#DDD7CB] overflow-x-auto" role="tablist" aria-label="Student Navigation">
          {[
            { id: 'pulse', label: '⚡ Pulse' },
            { id: 'timings', label: '⏱️ Timings' },
            { id: 'syllabus', label: '📋 Syllabus' },
            { id: 'question', label: '💬 Ask' },
            { id: 'notes', label: `📝 Log (${notes.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition ${
                subTab === tab.id
                  ? 'bg-[#1E262B] text-[#FAF8F4] font-semibold shadow-xs'
                  : 'text-[#575B66] hover:text-[#111215] hover:bg-[#EDE8E1]'
              }`}
              role="tab"
              aria-selected={subTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Pulse Surface */}
      {subTab === 'pulse' && (
        <div className="my-auto flex flex-col items-center text-center py-4" role="tabpanel" id="student-panel-pulse" aria-labelledby="student-tab-pulse">
          
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

      {/* Class Timings Tab */}
      {subTab === 'timings' && (
        <div className="py-2 overflow-y-auto max-h-[550px]" role="tabpanel" id="student-panel-timings" aria-labelledby="student-tab-timings">
          <ClassTimingsComponent
            roomCode={roomCode}
            courseName={courseName}
            activeTopic={activeTopic}
            onBackToPulse={() => setSubTab('pulse')}
          />
        </div>
      )}

      {/* Course Syllabus Tab */}
      {subTab === 'syllabus' && (
        <div className="py-2 overflow-y-auto max-h-[550px]" role="tabpanel" id="student-panel-syllabus" aria-labelledby="student-tab-syllabus">
          <ClassSyllabusComponent
            roomCode={roomCode}
            courseName={courseName}
            onBackToPulse={() => setSubTab('pulse')}
          />
        </div>
      )}

      {/* Backchannel Question View */}
      {subTab === 'question' && (
        <div className="my-auto flex flex-col gap-4 py-2" role="tabpanel" id="student-panel-question" aria-labelledby="student-tab-question">
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
        <div className="my-auto flex flex-col gap-3 py-2 max-h-72 overflow-y-auto" role="tabpanel" id="student-panel-notes" aria-labelledby="student-tab-notes">
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
      <div className="pt-3 border-t border-[#DDD7CB] flex items-center justify-around text-[10px] font-mono tracking-[0.16em] uppercase overflow-x-auto gap-1" role="tablist" aria-label="Student view tabs">
        {[
          { id: 'pulse', label: 'PULSE' },
          { id: 'timings', label: 'TIMINGS' },
          { id: 'syllabus', label: 'SYLLABUS' },
          { id: 'question', label: 'ASK' },
          { id: 'notes', label: `LOG (${notes.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`py-1 px-2.5 rounded transition whitespace-nowrap ${
              subTab === tab.id
                ? 'text-[#111215] font-bold bg-[#E5DFD5]'
                : 'text-[#7A7E89] hover:text-[#111215]'
            }`}
            role="tab"
            aria-selected={subTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
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
  authToken,
  currentUser,
  onOpenAuth,
}) {
  const [downloaded, setDownloaded] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Fetch live analytics from the server REST endpoint with RBAC bearer token
  useEffect(() => {
    setAnalyticsLoading(true);
    setAuthError(null);
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    fetch(`/api/sessions/${roomCode}/analytics`, { headers })
      .then(async (r) => {
        if (r.status === 401) {
          setAuthError('Authentication required: Sign in as the room instructor to view historical session analytics.');
          return null;
        }
        if (r.status === 403) {
          setAuthError('Access Denied: Only the verified instructor who owns this room can view aggregate telemetry and debrief reports.');
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data) setAnalyticsData(data);
        setAnalyticsLoading(false);
      })
      .catch(() => {
        setAnalyticsLoading(false);
      });
  }, [roomCode, authToken]);

  const total = pulses.length;
  const stepCount = pulses.filter((p) => p.tag === 'step').length;

  // Derived display values: prefer server data, fall back to in-memory
  const totalPulsesDisplay = analyticsData ? analyticsData.totalPulses : total;
  const hardestTopicDisplay = analyticsData ? analyticsData.hardestTopic : (
    topics.reduce((best, t) => {
      const count = pulses.filter((p) => p.topic === t.title).length;
      return count > (best.count || 0) ? { title: t.title, count } : best;
    }, {}).title || 'N/A'
  );
  const dominantTagDisplay = analyticsData ? analyticsData.dominantFactor : (
    total > 0
      ? Object.entries(
          pulses.reduce((acc, p) => { acc[p.tag] = (acc[p.tag] || 0) + 1; return acc; }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'step'
      : 'step'
  );
  const dominantPct = totalPulsesDisplay > 0
    ? Math.round(((analyticsData?.tagDistribution?.[dominantTagDisplay] || stepCount) / totalPulsesDisplay) * 100)
    : 0;
  const interventionsCountDisplay = analyticsData ? analyticsData.totalInterventions : interventions.length;
  // Flow index: % of 90s window where no friction signals fired (rough proxy)
  const flowIndex = totalStudents > 0 ? Math.max(0, Math.round(100 - (total / Math.max(1, totalStudents)) * 100)) : 100;

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

  const handleExportCSV = () => {
    // Header row
    const rows = [
      ['timestamp_iso', 'topic', 'tag', 'student_id', 'room'].join(','),
      ...pulses.map((p) => [
        new Date(p.timestamp).toISOString(),
        `"${(p.topic || '').replace(/"/g, '""')}"`,
        p.tag || '',
        p.studentId || '',
        roomCode,
      ].join(','))
    ];
    // Questions section
    rows.push('');
    rows.push(['question_id', 'text', 'upvotes', 'timestamp_iso'].join(','));
    questions.forEach((q) => {
      rows.push([
        q.id,
        `"${(q.text || '').replace(/"/g, '""')}"`,
        q.upvotes,
        new Date(q.timestamp).toISOString(),
      ].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NudgePoint_${roomCode}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="btn-gallery-pill-outline !py-2 !px-6 text-[10px]"
            aria-label="Export session data as CSV spreadsheet"
          >
            EXPORT CSV
          </button>
          <button
            onClick={handleExport}
            className="btn-gallery-pill-black !py-2 !px-6 text-[10px]"
            aria-label="Export session summary as Markdown report"
          >
            {downloaded ? 'DOWNLOADED MARKDOWN' : 'EXPORT MARKDOWN'}
          </button>
        </div>
      </div>

      {/* RBAC Authorization Guard Notice */}
      {authError && (
        <div className="p-6 rounded-2xl bg-[#FAF8F4] border border-[#EAD1A8] text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#111215] text-white flex items-center justify-center text-lg">
            🔒
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7A7E89] block mb-1">
              TEACHER RBAC RESTRICTION
            </span>
            <div className="font-serif text-xl text-[#111215]">
              Instructor Access Protected
            </div>
            <p className="text-xs text-[#575B66] mt-1.5 leading-relaxed max-w-md">
              {authError}
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="btn-gallery-pill-black !py-2 !px-5 text-xs font-mono mt-1"
          >
            🔑 Sign In as Prof. Euler
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {analyticsLoading ? (
          // Loading shimmer
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gallery-panel p-6 animate-pulse">
              <div className="h-2 w-16 bg-[#DDD7CB] rounded mb-3" />
              <div className="h-6 w-24 bg-[#DDD7CB] rounded mb-1" />
              <div className="h-2 w-20 bg-[#DDD7CB] rounded" />
            </div>
          ))
        ) : (
          [
            { label: 'Flow Index', val: `${flowIndex}%`, sub: 'Est. lecture flow' },
            { label: 'Peak Friction', val: hardestTopicDisplay.length > 20 ? hardestTopicDisplay.slice(0, 20) + '…' : (hardestTopicDisplay || 'N/A'), sub: 'Highest friction topic' },
            { label: 'Primary Cause', val: dominantTagDisplay ? dominantTagDisplay.charAt(0).toUpperCase() + dominantTagDisplay.slice(1) : 'N/A', sub: `${dominantPct}% of pulses` },
            { label: 'Interventions', val: `${interventionsCountDisplay} Deployed`, sub: 'Bridges used' },
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
          ))
        )}
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
    <div
      className="w-full h-12 pt-1"
      role="img"
      aria-label={`Friction velocity sparkline: ${pulses.length} pulse events recorded in the last ${windowDurationSec} seconds`}
    >
      <canvas ref={canvasRef} width={600} height={48} className="w-full h-full block" aria-hidden="true" />
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
