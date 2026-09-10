import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { adminCodeLogin } = useAuth();

  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking specifically for LoginPage
  const containerRef = useRef<HTMLDivElement>(null);
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  // Smooth springs for fluid cursor trail and spotlight
  const springX = useSpring(rawMouseX, { stiffness: 160, damping: 24 });
  const springY = useSpring(rawMouseY, { stiffness: 160, damping: 24 });

  // Secondary spring with lighter damping for a trailing glow orb
  const trailX = useSpring(rawMouseX, { stiffness: 85, damping: 18 });
  const trailY = useSpring(rawMouseY, { stiffness: 85, damping: 18 });

  // Subtle 3D perspective tilt on the card based on mouse position
  const cardRotateX = useTransform(springY, y => {
    if (typeof window === 'undefined') return 0;
    const center = window.innerHeight / 2;
    return -((y - center) / center) * 6; // max 6 deg
  });

  const cardRotateY = useTransform(springX, x => {
    if (typeof window === 'undefined') return 0;
    const center = window.innerWidth / 2;
    return ((x - center) / center) * 6; // max 6 deg
  });

  useEffect(() => {
    // Initialize mouse to screen center
    if (typeof window !== 'undefined') {
      rawMouseX.set(window.innerWidth / 2);
      rawMouseY.set(window.innerHeight / 2);
    }
  }, [rawMouseX, rawMouseY]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    rawMouseX.set(e.clientX);
    rawMouseY.set(e.clientY);
    if (!isHovered) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleAdminCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await adminCodeLogin(adminCode);
    } catch (err: any) {
      setError(err.message || 'Code d’accès invalide. Accès refusé.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen bg-[#061822] flex flex-col justify-center items-center p-4 selection:bg-teal-400 selection:text-slate-900 font-sans relative overflow-hidden cursor-default"
    >
      {/* ================= MOUSE HOVER EFFECTS (LOGIN PAGE ONLY) ================= */}
      
      {/* 1. Large Soft Cursor-Following Atmospheric Spotlight */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl z-0"
        style={{
          left: trailX,
          top: trailY,
          width: 550,
          height: 550,
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.22) 0%, rgba(6, 182, 212, 0.10) 40%, transparent 70%)',
          opacity: isHovered ? 1 : 0.3
        }}
        transition={{ opacity: { duration: 0.4 } }}
      />

      {/* 2. Focused Cursor Halo Ring with Glow Bead */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-30 hidden sm:block"
        style={{
          left: springX,
          top: springY,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ opacity: { duration: 0.25 } }}
      >
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Ring */}
          <div className="w-10 h-10 rounded-full border border-teal-400/40 bg-teal-400/5 shadow-[0_0_25px_rgba(45,212,191,0.35)] animate-pulse" />
          {/* Central Precise Dot */}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-teal-300 shadow-[0_0_8px_#2dd4bf]" />
        </div>
      </motion.div>

      {/* ================= AMBIENT BACKGROUND LAYER ================= */}

      {/* Dynamic Animated Ambient Background Orbs */}
      <motion.div
        animate={{
          x: [0, 35, -25, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.95, 1],
          opacity: [0.15, 0.25, 0.18, 0.15]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-gradient-to-br from-teal-500 to-emerald-600 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        animate={{
          x: [0, -40, 25, 0],
          y: [0, 35, -25, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.12, 0.22, 0.15, 0.12]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-cyan-500 to-teal-700 rounded-full blur-3xl pointer-events-none"
      />

      {/* Subtle Central Pulse Ring */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.04, 0.08, 0.04]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-teal-400/20 pointer-events-none"
      />

      {/* Cybernetic Dot Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:28px_28px] opacity-15 pointer-events-none" />

      {/* ================= MAIN CONTENT ================= */}
      <div className="w-full max-w-md space-y-6 relative z-10 flex flex-col items-center">
        
        {/* STEP 1: LOGO APPEARS FIRST */}
        <motion.div
          initial={{ opacity: 0, scale: 0.45, y: -25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.05
          }}
          className="text-center space-y-3 flex flex-col items-center"
        >
          {/* Animated Emblem with Backlight */}
          <div className="relative inline-flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{
                scale: [1, 1.22, 1],
                opacity: [0.35, 0.75, 0.35]
              }}
              transition={{
                scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                default: { duration: 0.6 }
              }}
              className="absolute inset-0 rounded-3xl bg-teal-400 blur-xl"
            />

            <motion.div
              initial={{ rotate: -15 }}
              animate={{ rotate: 0 }}
              whileHover={{ scale: 1.08, rotate: 3 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-2xl shadow-teal-500/40 border border-teal-300/40 flex items-center justify-center cursor-pointer"
            >
              <ShieldCheck className="w-10 h-10 drop-shadow-md text-white" />
            </motion.div>

            {/* Micro Live Activity Dot */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#061822]" />
            </span>
          </div>

          {/* Title & Badge staggered right after logo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-400/25 text-[11px] font-semibold text-teal-300 mb-2.5">
              <Lock className="w-3 h-3 text-teal-400" />
              <span>Espace Sécurisé</span>
            </div>
            
            {/* Say 'Bonjour Docteur' instead of 'Portail Administrateur' */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-center flex items-center justify-center gap-2">
              <span>Bonjour Docteur</span>
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3.5 }}
                className="inline-block origin-bottom-right"
              >
                👋
              </motion.span>
            </h1>

            <p className="text-xs font-medium text-teal-200/75 tracking-wide mt-1.5 text-center">
              Cabinet Médical • Authentification Confidentielle
            </p>
          </motion.div>
        </motion.div>

        {/* STEP 2: LOGIN BOX APPEARS AFTER LOGO HAS SETTLED */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          style={{
            rotateX: cardRotateX,
            rotateY: cardRotateY,
            transformPerspective: 1000
          }}
          transition={{
            duration: 0.65,
            delay: 0.8, // Appears smoothly after the logo is revealed
            ease: [0.16, 1, 0.3, 1]
          }}
          className="w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40 border border-white/80 overflow-hidden relative transition-shadow duration-300 hover:shadow-teal-500/10"
        >
          {/* Glowing Top Active Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500" />

          {/* Card Header Tag: Code Maître PIN */}
          <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Code Maître PIN</h2>
                <p className="text-[11px] text-slate-500 font-medium">Authentification sécurisée par clé confidentielle</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Sécurité active</span>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Error Notification with Motion Spring */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-900 shadow-xs"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Exclusive Master PIN Form */}
            <form onSubmit={handleAdminCodeSubmit} className="space-y-4">
              <div className="p-3.5 bg-teal-50/80 rounded-2xl border border-teal-200/70 text-xs text-teal-950">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <Fingerprint className="w-4 h-4 text-teal-600" />
                  <span>Déverrouillage Praticien</span>
                </div>
                <p className="text-[11px] text-teal-800/85 mt-1 leading-relaxed">
                  Veuillez saisir votre code PIN confidentiel pour déverrouiller l'accès au dossier et aux consultations.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Code Secret Administrateur
                </label>

                <div className="relative">
                  <input
                    type={showAdminCode ? 'text' : 'password'}
                    required
                    value={adminCode}
                    onChange={e => {
                      setAdminCode(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    autoComplete="off"
                    autoFocus
                    className="w-full px-4 py-3.5 bg-slate-50/90 border border-slate-200 rounded-2xl text-center tracking-[0.35em] font-mono text-xl font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 focus:ring-3 focus:ring-teal-500/20 focus:bg-white transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminCode(!showAdminCode)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                    title={showAdminCode ? 'Masquer' : 'Afficher'}
                  >
                    {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading || !adminCode.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-full shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Vérification de sécurité...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Déverrouiller l'Espace Médical</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* Security Notice Footer */}
          <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="font-medium">Chiffrement AES-256 • Conforme Données de Santé & Audit Sys</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
