import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, writeBatch, getDocs } from 'firebase/firestore';
import { Ghost, Skull, Timer, Trophy, CheckCircle, Lock, Users, BarChart3, Loader2, AlertTriangle, Wand2, RefreshCw, Key } from 'lucide-react';

// --- Global Variable Access (Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Constants & Aesthetic Styling ---
const MUMMY_COUNT = 10;
const VOTING_DURATION_MINUTES = 5;

// **SECURITY NOTE**: Host Dashboard is secured by this key.
const HOST_SECRET_KEY = "MUMMY_TOWN_HALL_2025"; 

// Classic Black/Orange/Purple Halloween Theme
const HALLOWEEN_COLORS = {
  bg: 'bg-black',
  card: 'bg-gray-900/90 backdrop-blur-sm',
  primary: 'text-orange-400',
  accent: 'text-purple-400',
  border: 'border-orange-500/50',
  shadow: 'shadow-2xl shadow-purple-900/50',
};

const HALLOWEEN_GRADIENT = "bg-gradient-to-br from-orange-800 to-purple-800";
const NEON_GLOW = 'shadow-md shadow-orange-400/50 hover:shadow-lg hover:shadow-orange-400/80 transition-all duration-300';
const BUTTON_STYLE = `py-3 px-6 rounded-full font-extrabold uppercase tracking-wider ${HALLOWEEN_GRADIENT} text-white ${NEON_GLOW} border-2 border-orange-500/80`;

// --- Utility Functions ---

/**
 * Custom hook for exponential backoff retry logic.
 */
const useExponentialBackoff = () => {
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const runWithRetry = useCallback(async (fn, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) {
          console.error("Max retries reached. Operation failed.", error);
          throw error;
        }
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await wait(delay);
      }
    }
  }, []);

  return runWithRetry;
};


// --- Aesthetic Components ---

// Detailed Laughing Pumpkin SVG Animation
const PumpkinAnimated = ({ className = '', style = {} }) => (
  <div
    className={`absolute w-24 h-24 ${className}`}
    style={{ ...style, animation: 'pumpkin-pulse 4s infinite alternate, horizontal-float 15s infinite linear' }}
  >
    <style jsx="true">{`
      @keyframes pumpkin-pulse {
        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px orange); }
        50% { transform: scale(1.1); filter: drop-shadow(0 0 15px darkorange); }
      }
      @keyframes horizontal-float {
        0% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <circle cx="50" cy="50" r="45" fill="#FF8C00" />
      {/* Stem */}
      <rect x="45" y="5" width="10" height="15" rx="5" fill="#228B22" />
      {/* Eyes (Triangles) */}
      <path d="M30 35 L45 35 L37.5 50 Z" fill="black" />
      <path d="M70 35 L55 35 L62.5 50 Z" fill="black" />
      {/* Mouth (Cackling) */}
      <path d="M25 65 C35 75, 65 75, 75 65 L65 70 L50 60 L35 70 Z" fill="black" />
    </svg>
  </div>
);


// Component for the moody background using SVG and CSS to simulate the reference image
const HalloweenBackground = () => {
  // Generate star data once
  const stars = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      cx: Math.random() * 100, 
      cy: Math.random() * 50, 
      r: Math.random() * 0.1 + 0.05,
      delay: `${i * 0.08}s` 
    }));
  }, []); 

  return (
    <>
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {/* Starry Night Sky with Big Moon (top left) */}
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Big Moon (simulated bright yellow/orange glow) */}
          <circle cx="10" cy="10" r="8" fill="#F9AC3E" opacity="0.9" filter="url(#glow)" />
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Small Stars (animated) */}
          {stars.map((star, i) => (
            <circle 
              key={i} 
              cx={star.cx} 
              cy={star.cy} 
              r={star.r} 
              fill="#FFD700" 
              opacity={Math.random() * 0.5 + 0.3} 
              className={`star-${i}`} 
            />
          ))}
          {/* Moody Architectural Silhouettes (bottom) */}
          <path d="M0 100 L0 75 C10 70, 20 75, 30 70 L30 100 Z M35 100 L35 60 C50 50, 70 50, 85 60 L85 100 Z M90 100 L90 80 C95 78, 100 85, 100 85 L100 100 Z" fill="#111827" opacity="0.8" />
          <path d="M15 100 L15 80 C20 78, 25 80, 25 80 L25 100 Z" fill="#1F2937" opacity="0.85" /> 
        </svg>
        <style jsx="true">{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          @keyframes float-ghost {
            0%, 100% { transform: translateY(0) rotate(0); opacity: 0.6; }
            50% { transform: translateY(-30px) rotate(5deg); opacity: 0.8; }
          }
          /* Apply individual animation delays to stars using generated class names */
          ${stars.map((star, i) => `.star-${i} { animation: twinkle ${Math.random() * 5 + 3}s infinite alternate; animation-delay: ${star.delay}; }`).join('\n')}
        `}</style>

        {/* Floating Animated Ghost Figures */}
        <div className="absolute top-[15%] left-[5%] text-gray-400/50" style={{ animation: 'float-ghost 10s infinite ease-in-out', animationDelay: '1s' }}>
          <Ghost className="w-10 h-10"/>
        </div>
        <div className="absolute top-[55%] right-[10%] text-gray-400/50" style={{ animation: 'float-ghost 12s infinite ease-in-out', animationDelay: '5s' }}>
          <Ghost className="w-12 h-12"/>
        </div>
        <div className="absolute bottom-[5%] left-[30%] text-gray-400/50" style={{ animation: 'float-ghost 9s infinite ease-in-out', animationDelay: '3s' }}>
          <Ghost className="w-8 h-8"/>
        </div>
        
        {/* Animated Laughing Pumpkin (moving across the screen) */}
        <PumpkinAnimated className="top-[70%] left-[-15%] md:w-32 md:h-32" style={{ animationDelay: '2s', animationDuration: '20s' }} />
        <PumpkinAnimated className="top-[10%] right-[-10%]" style={{ animationDelay: '10s', animationDuration: '25s', animationDirection: 'reverse' }} />
      </div>
    </>
  );
};

// --- Pitch Generator Modal (New Component) ---

const PitchGeneratorModal = ({ isOpen, onClose, runWithRetry }) => {
  const [teamNumber, setTeamNumber] = useState(1);
  const [itemsCollected, setItemsCollected] = useState('A pink clip, a silver watch, a rubber chicken.');
  const [tone, setTone] = useState('Hilarious and absurd');
  const [pitchScript, setPitchScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = ""; // Canvas runtime provides this

  const generatePitch = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setPitchScript('');

    const systemPrompt = "You are a theatrical and flamboyant contest announcer for a Mummy Costume competition. Your task is to write a short, punchy 30-second pitch script for a team. The script MUST include the team number and mention the collected items in an over-the-top, dramatic, or funny way, matching the requested tone. Use ALL CAPS and strong language suitable for a stage show.";
    const userQuery = `Generate a pitch script for Team #${teamNumber}. The team's collected accessories are: ${itemsCollected}. The required tone is: ${tone}.`;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const response = await runWithRetry(() => fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }));

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setPitchScript(text);
      } else {
        setError("Failed to generate pitch. The spirits are silent!");
      }

    } catch (e) {
      console.error("Gemini API error:", e);
      setError("A cosmic disturbance prevented the pitch generation. Check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className={`p-8 rounded-3xl max-w-2xl w-full ${HALLOWEEN_COLORS.card} border-4 ${HALLOWEEN_COLORS.border} ${HALLOWEEN_COLORS.shadow}`}>
        
        <h2 className="text-3xl font-black text-white text-center border-b border-purple-500/50 pb-3 mb-6 flex items-center justify-center">
          <Wand2 className={`${HALLOWEEN_COLORS.accent} w-7 h-7 mr-3 animate-spin-slow`} />
          ✨ PITCH MAGIC GENERATOR ✨
        </h2>
        
        <div className="space-y-4 mb-6">
          <label className="block text-orange-400 font-bold">
            Team Mummy Number (1-10):
            <select
              value={teamNumber}
              onChange={(e) => setTeamNumber(parseInt(e.target.value))}
              className="mt-1 w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-orange-500 focus:border-orange-500"
            >
              {Array.from({ length: MUMMY_COUNT }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>Team #{num}</option>
              ))}
            </select>
          </label>

          <label className="block text-orange-400 font-bold">
            Scavenger Hunt Items (List the key accessories):
            <textarea
              value={itemsCollected}
              onChange={(e) => setItemsCollected(e.target.value)}
              className="mt-1 w-full p-2 rounded bg-gray-700 text-white border border-gray-600 h-20 focus:ring-orange-500 focus:border-orange-500"
              placeholder="E.g., A pink clip, a silver watch, a rubber chicken."
            />
          </label>

          <label className="block text-orange-400 font-bold">
            Desired Pitch Tone:
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:ring-orange-500 focus:border-orange-500"
            >
              <option>Hilarious and absurd</option>
              <option>Deeply spooky and serious</option>
              <option>Epic and overly dramatic</option>
              <option>Silly and family-friendly</option>
            </select>
          </label>
        </div>

        <button
          onClick={generatePitch}
          disabled={isLoading}
          className={`${BUTTON_STYLE} w-full flex items-center justify-center !py-3 mb-4 disabled:opacity-50`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              SUMMONING SCRIPT...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              GENERATE NEW PITCH
            </>
          )}
        </button>

        {error && <p className="text-red-400 text-center mt-3 p-2 bg-red-900/40 rounded">{error}</p>}

        {pitchScript && (
          <div className="mt-6 p-4 border-4 border-purple-500/70 bg-gray-800/70 rounded-xl shadow-xl shadow-purple-900/50">
            <h3 className="text-xl font-extrabold text-orange-400 mb-2 flex items-center">
              <Skull className="w-5 h-5 mr-2" />
              Generated Pitch:
            </h3>
            <pre className="whitespace-pre-wrap font-serif text-white text-lg p-2 leading-relaxed">
              {pitchScript}
            </pre>
          </div>
        )}

        <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-700/80 text-gray-300 rounded-full font-bold hover:bg-gray-600 transition">
          Close Generator
        </button>
      </div>
    </div>
  );
};


// --- Custom Modal ---

/**
 * Custom Modal for Confirmation (replacing window.confirm)
 */
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className={`p-8 rounded-xl max-w-sm w-full ${HALLOWEEN_COLORS.card} border-4 ${HALLOWEEN_COLORS.border} ${HALLOWEEN_COLORS.shadow}`}>
                <div className="text-center mb-6">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                    <h3 className="text-2xl font-bold text-white mt-3">{title}</h3>
                </div>
                <p className="text-gray-300 text-center mb-6">{message}</p>
                <div className="flex justify-between space-x-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-full font-bold text-gray-300 bg-gray-700/70 hover:bg-gray-600 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 rounded-full font-bold text-white bg-red-600 hover:bg-red-700 transition"
                    >
                        Confirm Reset
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Core Components (Restyled) ---

/**
 * Displays a countdown timer and the current voting phase.
 */
const TimerDisplay = ({ votingStartTime, durationMinutes }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const now = Date.now();

  const isVotingActive = useMemo(() => {
    if (!votingStartTime) return false;
    const endTime = votingStartTime + durationMinutes * 60 * 1000;
    return now >= votingStartTime && now < endTime;
  }, [votingStartTime, durationMinutes, now]);

  const isVotingClosed = useMemo(() => {
    if (!votingStartTime) return false;
    const endTime = votingStartTime + durationMinutes * 60 * 1000;
    return now >= endTime;
  }, [votingStartTime, durationMinutes, now]);


  useEffect(() => {
    if (isVotingActive) {
      const timer = setInterval(() => {
        const endTime = votingStartTime + durationMinutes * 60 * 1000;
        const remaining = endTime - Date.now();

        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setTimeLeft(null);
    }
  }, [isVotingActive, votingStartTime, durationMinutes]);

  const formatTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!votingStartTime) {
    return <div className={`flex items-center space-x-2 ${HALLOWEEN_COLORS.primary}`}>
      <Timer className="w-5 h-5" />
      <p className="font-semibold text-sm">Voting PENDING</p>
    </div>;
  }

  if (isVotingClosed) {
    return <div className="flex items-center space-x-2 text-red-500">
      <Lock className="w-5 h-5" />
      <p className="font-semibold text-sm">VOTING CLOSED</p>
    </div>;
  }

  return (
    <div className={`flex items-center space-x-3 text-2xl font-mono p-2 rounded-xl bg-orange-900/50 border border-orange-500/70`}>
      <Timer className="w-6 h-6 text-orange-400" />
      <span className="text-white font-extrabold">{formatTime(timeLeft)}</span>
    </div>
  );
};


/**
 * The main component for casting a vote.
 */
const VotingScreen = ({ db, userId, appState, userVote, runWithRetry }) => {
  const [selectedMummy, setSelectedMummy] = useState(userVote?.mummyId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const votingStartTime = (
    appState?.votingStartTime?.toMillis ? 
    appState.votingStartTime.toMillis() : 
    appState?.votingStartTime
  );
  
  const durationMinutes = appState?.votingDurationMinutes || VOTING_DURATION_MINUTES;
  const endTime = votingStartTime ? votingStartTime + durationMinutes * 60 * 1000 : Infinity;
  const isVotingActive = Date.now() < endTime && votingStartTime;
  const hasVoted = !!userVote;

  useEffect(() => {
    setSelectedMummy(userVote?.mummyId || null);
  }, [userVote]);

  const handleVote = async (mummyId) => {
    if (!isVotingActive || isSubmitting || !userId || !db) return;

    setIsSubmitting(true);
    setError(null);

    const voteDocRef = doc(db, `artifacts/${appId}/public/data/mummy_votes`, userId);

    try {
      await runWithRetry(() => setDoc(voteDocRef, {
        voterId: userId,
        mummyId: mummyId,
        timestamp: Date.now(),
      }));
      setSelectedMummy(mummyId);
    } catch (e) {
      console.error("Error submitting vote:", e);
      setError("Failed to submit vote. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!votingStartTime) {
    return (
      <div className={`p-10 text-center ${HALLOWEEN_COLORS.card} rounded-3xl ${HALLOWEEN_COLORS.border} border-4 ${HALLOWEEN_COLORS.shadow}`}>
        <Ghost className={`mx-auto w-16 h-16 ${HALLOWEEN_COLORS.primary} animate-pulse`} />
        <h2 className="text-3xl font-extrabold text-white mt-6">The Mummies are Preparing...</h2>
        <p className={`${HALLOWEEN_COLORS.accent} mt-3 text-lg`}>The host has not yet opened the portal. Prepare to cast your spooky verdict!</p>
      </div>
    );
  }

  if (!isVotingActive) {
    return (
      <div className={`p-10 text-center ${HALLOWEEN_COLORS.card} rounded-3xl ${HALLOWEEN_COLORS.border} border-4 ${HALLOWEEN_COLORS.shadow}`}>
        <Lock className="mx-auto w-16 h-16 text-red-500" />
        <h2 className="text-3xl font-extrabold text-white mt-6">VOTING CHAMBER SEALED</h2>
        <p className={`${HALLOWEEN_COLORS.accent} mt-3 text-lg`}>The time limit has expired. Check the main screen for the grand reveal!</p>
        {userVote && <p className="text-base mt-4 text-gray-400">Your final choice was for Mummy #{userVote.mummyId}.</p>}
      </div>
    );
  }

  return (
    <div className={`p-6 md:p-10 ${HALLOWEEN_COLORS.card} rounded-3xl ${HALLOWEEN_COLORS.border} border-4 ${HALLOWEEN_COLORS.shadow} max-w-5xl mx-auto`}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-orange-500/30 pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center mb-4 md:mb-0">
          <Skull className={`${HALLOWEEN_COLORS.primary} w-8 h-8 mr-3 animate-pulse`} />
          Approve the Best Accessory-Mummy!
        </h2>
        <TimerDisplay votingStartTime={votingStartTime} durationMinutes={durationMinutes} />
      </div>

      <p className={`${HALLOWEEN_COLORS.accent} text-lg mb-8 font-semibold text-center`}>
        {hasVoted ? `You have cast your vote for Mummy #${selectedMummy}. You may change your vote until the timer runs out.` : "Select one Mummy below to cast your secure, one-time vote."}
      </p>

      {error && <div className="text-red-400 p-3 bg-red-900/50 rounded-lg mb-4 font-medium">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
        {Array.from({ length: MUMMY_COUNT }, (_, i) => i + 1).map((mummyId) => {
          const isCurrentVote = selectedMummy === mummyId;
          return (
            <button
              key={mummyId}
              onClick={() => handleVote(mummyId)}
              disabled={isSubmitting || !isVotingActive}
              className={`
                p-6 flex flex-col items-center justify-center rounded-2xl transition-all duration-300
                font-extrabold text-3xl border-4
                ${isCurrentVote
                  ? 'border-orange-400 bg-orange-900/80 text-orange-300 transform scale-[1.05] shadow-xl shadow-orange-900/90'
                  : 'border-purple-600 bg-gray-800/80 text-purple-400 hover:border-orange-400 hover:text-orange-300 hover:scale-[1.02]'}
                ${NEON_GLOW}
              `}
            >
              <Ghost className="w-10 h-10 mb-2" />
              Mummy #{mummyId}
              <span className="text-sm font-normal mt-2 text-gray-400">
                {isSubmitting && isCurrentVote ? 'Processing...' : (hasVoted && isCurrentVote ? 'VOTED' : 'VOTE')}
              </span>
              {isCurrentVote && !isSubmitting && <CheckCircle className="w-5 h-5 mt-1 text-orange-400" />}
            </button>
          );
        })}
      </div>
      <p className="text-sm mt-8 text-gray-600 text-center">Your unique voter ID: <code className="break-all text-purple-300 bg-gray-800 p-1 rounded">VOTER-{userId}</code></p>
    </div>
  );
};

/**
 * The real-time dashboard for the host/audience screen.
 */
const DashboardScreen = ({ db, appState, mummyVotes, runWithRetry }) => {
  const totalVotes = useMemo(() => Object.values(mummyVotes).reduce((sum, count) => sum + count, 0), [mummyVotes]);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for the custom confirmation modal
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false); // State for the new pitch generator modal

  // Safely derive votingStartTime
  const votingStartTime = (
    appState?.votingStartTime?.toMillis ? 
    appState.votingStartTime.toMillis() : 
    appState?.votingStartTime
  );

  const durationMinutes = appState?.votingDurationMinutes || VOTING_DURATION_MINUTES;
  const isVotingActive = votingStartTime && Date.now() < (votingStartTime + durationMinutes * 60 * 1000);
  const isVotingClosed = votingStartTime && Date.now() >= (votingStartTime + durationMinutes * 60 * 1000);

  // Host Control Functions
  const appStateDocRef = doc(db, `artifacts/${appId}/public/data/app_state`, 'settings');

  const handleStartVoting = async () => {
    if (!db || isUpdatingState) return;
    setIsUpdatingState(true);
    try {
      await runWithRetry(() => setDoc(appStateDocRef, {
        votingStartTime: Date.now(), 
        votingDurationMinutes: VOTING_DURATION_MINUTES,
      }));
    } catch (e) {
      console.error("Error starting voting:", e);
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleStopVoting = async () => {
    if (!db || isUpdatingState) return;
    setIsUpdatingState(true);
    try {
      const now = Date.now();
      await runWithRetry(() => setDoc(appStateDocRef, {
        votingStartTime: now - VOTING_DURATION_MINUTES * 60 * 1000,
        votingDurationMinutes: VOTING_DURATION_MINUTES,
      }));
    } catch (e) {
      console.error("Error stopping voting:", e);
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsModalOpen(false); // Close modal
    if (!db || isResetting) return;
    setIsResetting(true);

    try {
      const batch = writeBatch(db);

      // 1. Reset App State
      batch.set(appStateDocRef, {
        votingStartTime: null,
        votingDurationMinutes: VOTING_DURATION_MINUTES,
      });

      // 2. Clear all votes
      const q = query(collection(db, `artifacts/${appId}/public/data/mummy_votes`));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await runWithRetry(() => batch.commit());

      console.log("System reset complete.");
    } catch (e) {
      console.error("Error during full system reset:", e);
    } finally {
      setIsResetting(false);
    }
  };


  // Helper to determine the winner(s)
  const winningMummies = useMemo(() => {
    if (totalVotes === 0) return [];
    let maxVotes = 0;
    let winners = [];

    for (const [mummyId, count] of Object.entries(mummyVotes)) {
      if (count > maxVotes) {
        maxVotes = count;
        winners = [Number(mummyId)];
      } else if (count === maxVotes && count > 0) {
        winners.push(Number(mummyId));
      }
    }
    return winners;
  }, [mummyVotes, totalVotes]);

  return (
    <>
      <ConfirmationModal
          isOpen={isModalOpen}
          title="DANGER: Full System Reset"
          message="This action will permanently delete all votes and reset the timer state. Proceed only if you are starting a new game."
          onConfirm={handleConfirmReset}
          onCancel={() => setIsModalOpen(false)}
      />
      <PitchGeneratorModal
          isOpen={isPitchModalOpen}
          onClose={() => setIsPitchModalOpen(false)}
          runWithRetry={runWithRetry}
      />
      <div className={`p-6 md:p-10 ${HALLOWEEN_COLORS.card} rounded-3xl ${HALLOWEEN_COLORS.border} border-4 ${HALLOWEEN_COLORS.shadow}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-orange-500/30 pb-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center mb-4 sm:mb-0">
            <BarChart3 className={`${HALLOWEEN_COLORS.primary} w-8 h-8 mr-3`} />
            Live Casket Count (Audience View)
          </h2>
          <div className="flex items-center space-x-4">
            <TimerDisplay votingStartTime={votingStartTime} durationMinutes={durationMinutes} isHost={true} />
          </div>
        </div>

        {/* Host Controls */}
        <div className="mb-8 p-4 bg-gray-900/50 rounded-xl border border-purple-700/50 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 md:space-x-4">
          <p className="text-sm font-semibold text-gray-400">Host Controls:</p>
          <div className="flex space-x-3">
            {!votingStartTime || isVotingClosed ? (
              <button
                onClick={handleStartVoting}
                disabled={isUpdatingState || isResetting}
                className={`${BUTTON_STYLE} bg-orange-600/90 hover:bg-orange-500/90 disabled:opacity-50 !py-2 !px-4`}
              >
                {isUpdatingState ? <Loader2 className="animate-spin" /> : `START ${VOTING_DURATION_MINUTES} MIN VOTE`}
              </button>
            ) : isVotingActive ? (
              <button
                onClick={handleStopVoting}
                disabled={isUpdatingState || isResetting}
                className={`${BUTTON_STYLE} bg-red-600/90 hover:bg-red-500/90 disabled:opacity-50 !py-2 !px-4`}
              >
                {isUpdatingState ? <Loader2 className="animate-spin" /> : 'STOP VOTE NOW'}
              </button>
            ) : (
              <span className="text-red-400 font-bold">Voting Ended</span>
            )}

            <button
              onClick={() => setIsModalOpen(true)} // Open custom modal instead of window.confirm
              disabled={isResetting || isUpdatingState}
              className={`${BUTTON_STYLE} bg-gray-600/90 hover:bg-gray-500/90 disabled:opacity-50 !py-2 !px-4`}
            >
              {isResetting ? <Loader2 className="animate-spin" /> : 'RESET ALL DATA'}
            </button>
          </div>
        </div>
        
        {/* Gemini Feature Button */}
        <div className="mb-8 p-4 bg-gray-900/50 rounded-xl border border-orange-700/50">
            <button
                onClick={() => setIsPitchModalOpen(true)}
                className={`${BUTTON_STYLE} w-full flex items-center justify-center !py-3`}
            >
                <Wand2 className="w-5 h-5 mr-3" />
                ✨ GENERATE MUMMY PITCH SCRIPT ✨
            </button>
        </div>


        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-white mb-8">
          <div className="flex items-center space-x-2 text-xl font-bold p-3 bg-gray-800/70 rounded-xl border border-purple-700">
            <Users className={`${HALLOWEEN_COLORS.primary} w-6 h-6`} />
            <span>Total Votes: <span className="text-3xl text-orange-400">{totalVotes}</span></span>
          </div>
          <div className="flex items-center space-x-2 text-xl font-bold p-3 bg-gray-800/70 rounded-xl border border-purple-700">
            <Trophy className={`${HALLOWEEN_COLORS.accent} w-6 h-6`} />
            <span>Champion Mummy(s): <span className="text-3xl text-purple-400">{winningMummies.length > 0 ? winningMummies.join(', ') : 'TBD'}</span></span>
          </div>
        </div>


        {/* Bar Chart - Real-time Visualization */}
        <div className="space-y-5">
          {Array.from({ length: MUMMY_COUNT }, (_, i) => i + 1).map((mummyId) => {
            const votes = mummyVotes[mummyId] || 0;
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            const isWinner = isVotingClosed && winningMummies.includes(mummyId);

            return (
              <div key={mummyId} className="flex items-center space-x-4">
                <div className="w-20 font-extrabold text-white text-xl flex items-center justify-center">
                  <Skull className="w-5 h-5 mr-1 text-orange-400" /> M#{mummyId}
                </div>
                <div className="flex-1 h-10 rounded-full overflow-hidden border border-orange-700 bg-gray-800/50">
                  <div
                    className={`h-full transition-all duration-700 ease-out flex items-center px-4 font-black text-lg text-white whitespace-nowrap
                      ${isWinner ? 'bg-orange-600 shadow-lg shadow-orange-500/50' : HALLOWEEN_GRADIENT}`}
                    style={{ width: `${Math.max(percentage, 2)}%" `}}
                  >
                    {votes} Votes ({percentage.toFixed(1)}%)
                    {isWinner && <Trophy className="w-5 h-5 ml-2 text-yellow-300" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};


/**
 * Main App Component
 */
export default function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [appState, setAppState] = useState(null);
  const [mummyVotes, setMummyVotes] = useState({});
  const [userVote, setUserVote] = useState(null);
  
  // Start in Voter Portal View by default
  const [isHostView, setIsHostView] = useState(false); 
  const [hostKeyInput, setHostKeyInput] = useState('');
  const [hostError, setHostError] = useState('');


  const runWithRetry = useExponentialBackoff();


  // 1. Firebase Initialization and Authentication
  useEffect(() => {
    if (!firebaseConfig) {
      console.error("Firebase config is missing.");
      return;
    }

    let authCleanup;

    const initializeFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        authCleanup = onAuthStateChanged(firebaseAuth, (user) => {
          if (user) {
            setUserId(user.uid);
            setIsAuthReady(true);
          } else {
            if (initialAuthToken) {
                signInWithCustomToken(firebaseAuth, initialAuthToken)
                    .catch(e => console.error("Custom token sign-in failed:", e));
            } else {
                signInAnonymously(firebaseAuth)
                    .catch(e => console.error("Anonymous sign-in failed:", e));
            }
          }
        });
        
        // Initial sign-in attempt
        if (!firebaseAuth.currentUser) {
             if (initialAuthToken) {
                signInWithCustomToken(firebaseAuth, initialAuthToken)
                    .catch(e => console.error("Initial Custom token sign-in failed:", e));
            } else {
                signInAnonymously(firebaseAuth)
                    .catch(e => console.error("Initial Anonymous sign-in failed:", e));
            }
        }

      } catch (error) {
        console.error("Firebase initialization or sign-in failed:", error);
        setUserId(crypto.randomUUID());
        setIsAuthReady(true);
      }
    };

    initializeFirebase();

    return () => {
      if (authCleanup) authCleanup();
    };
  }, [runWithRetry]);

  // 2. Fetch App State (Voting Timer Settings)
  useEffect(() => {
    if (!isAuthReady || !db) return;

    const appStateDocRef = doc(db, `artifacts/${appId}/public/data/app_state`, 'settings');

    const unsubscribe = onSnapshot(appStateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppState(data);
      } else {
        setAppState({ votingStartTime: null, votingDurationMinutes: VOTING_DURATION_MINUTES });
        runWithRetry(() => setDoc(appStateDocRef, {
          votingStartTime: null,
          votingDurationMinutes: VOTING_DURATION_MINUTES,
        }));
      }
    }, (error) => {
      console.error("Error listening to app state:", error);
    });

    return () => unsubscribe();
  }, [db, isAuthReady, runWithRetry]);


  // 3. Fetch All Mummy Votes (for Dashboard)
  useEffect(() => {
    if (!isAuthReady || !db) return;

    const q = collection(db, `artifacts/${appId}/public/data/mummy_votes`);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      for (let i = 1; i <= MUMMY_COUNT; i++) {
        counts[i] = 0;
      }

      snapshot.forEach((doc) => {
        const vote = doc.data();
        if (vote.mummyId >= 1 && vote.mummyId <= MUMMY_COUNT) {
          counts[vote.mummyId]++;
        }
      });
      setMummyVotes(counts);
    }, (error) => {
      console.error("Error listening to mummy votes:", error);
    });

    return () => unsubscribe();
  }, [db, isAuthReady]);


  // 4. Fetch User's Specific Vote (for security/UX on Voting Screen)
  useEffect(() => {
    if (!isAuthReady || !db || !userId) {
      setUserVote(null);
      return;
    }

    const voteDocRef = doc(db, `artifacts/${appId}/public/data/mummy_votes`, userId);

    const unsubscribe = onSnapshot(voteDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserVote(docSnap.data());
      } else {
        setUserVote(null);
      }
    }, (error) => {
      console.error("Error listening to user vote:", error);
    });

    return () => unsubscribe();
  }, [db, isAuthReady, userId]);

  // --- Host Key Logic ---
  const handleHostKeySubmit = () => {
      if (hostKeyInput === HOST_SECRET_KEY) {
          setIsHostView(true);
          setHostError('');
      } else {
          setHostError('Invalid Host Key. Access denied.');
      }
  };

  // --- Render Logic ---

  if (!isAuthReady || !db || !userId || !appState) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${HALLOWEEN_COLORS.bg}`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 ${HALLOWEEN_COLORS.primary} animate-spin mx-auto`} />
          <p className="mt-4 text-white text-xl font-semibold">Summoning the spooky portal...</p>
        </div>
      </div>
    );
  }

  const Header = ({ title, icon: Icon }) => (
    <header className="py-6 mb-10 text-center border-b-4 border-orange-500/70">
      <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-widest text-white drop-shadow-lg text-orange-400`} style={{ textShadow: '0 0 10px #F97316, 0 0 25px #8B5CF6' }}>
        <Icon className="w-12 h-12 inline-block mr-3 mb-2" />
        {title}
      </h1>
    </header>
  );
  
  const HostAccessGate = () => (
    <div className={`p-8 rounded-3xl max-w-sm mx-auto ${HALLOWEEN_COLORS.card} border-4 ${HALLOWEEN_COLORS.border} ${HALLOWEEN_COLORS.shadow} text-center`}>
        <Key className={`mx-auto w-10 h-10 ${HALLOWEEN_COLORS.primary}`} />
        <h3 className="text-2xl font-bold text-white mt-4">Host Access Required</h3>
        <p className="text-gray-400 mb-4">Enter the secret key to view the Dashboard.</p>
        
        <input
            type="password"
            placeholder="Host Key"
            value={hostKeyInput}
            onChange={(e) => setHostKeyInput(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:ring-orange-500 focus:border-orange-500 mb-3"
            onKeyDown={(e) => { if (e.key === 'Enter') handleHostKeySubmit(); }}
        />
        
        <button 
            onClick={handleHostKeySubmit} 
            className={`${BUTTON_STYLE} w-full !py-2`}
        >
            UNLOCK DASHBOARD
        </button>
        
        {hostError && <p className="text-red-400 text-sm mt-3">{hostError}</p>}
        <button onClick={() => setIsHostView(false)} className="text-purple-400 text-sm mt-4 hover:text-purple-300">
            Go back to Voter Portal
        </button>
    </div>
);

  return (
    <div className={`min-h-screen ${HALLOWEEN_COLORS.bg} text-white font-serif p-4 md:p-8 relative overflow-hidden`}>
      <HalloweenBackground />
      
      <div className="relative z-10">
        <Header title="MUMMY MAYHEM VOTE" icon={Skull} />

        <div className="mb-10 flex justify-center space-x-6">
          <button
            onClick={() => setIsHostView(false)}
            className={`${BUTTON_STYLE} ${!isHostView ? 'ring-4 ring-orange-400' : 'opacity-75 hover:opacity-100 !bg-gray-800/80'}`}
          >
            <Ghost className="w-5 h-5 inline-block mr-2" />
            VOTER PORTAL
          </button>
          
          <button
            onClick={() => {
                if (isHostView) {
                    setIsHostView(false); // If currently host, switch to voter view
                } else {
                    setHostError('');
                    setHostKeyInput('');
                    setIsHostView(true); // Attempt to switch to host view, which triggers the gate
                }
            }}
            className={`${BUTTON_STYLE} ${isHostView ? 'ring-4 ring-purple-400' : 'opacity-75 hover:opacity-100 !bg-gray-800/80'}`}
          >
            <BarChart3 className="w-5 h-5 inline-block mr-2" />
            HOST DASHBOARD
          </button>
        </div>

        <main className="max-w-7xl mx-auto">
          {isHostView && hostKeyInput !== HOST_SECRET_KEY ? (
            <HostAccessGate />
          ) : isHostView && hostKeyInput === HOST_SECRET_KEY ? (
            <DashboardScreen
              db={db}
              appState={appState}
              mummyVotes={mummyVotes}
              runWithRetry={runWithRetry}
            />
          ) : (
             <VotingScreen
              db={db}
              userId={userId}
              appState={appState}
              userVote={userVote}
              runWithRetry={runWithRetry}
            />
          )}
        </main>

        <footer className="text-center mt-16 text-sm text-gray-700 pt-6">
          <p>Beware: One Vote Per Spirit! App ID: {appId}</p>
        </footer>
      </div>
    </div>
  );
}
