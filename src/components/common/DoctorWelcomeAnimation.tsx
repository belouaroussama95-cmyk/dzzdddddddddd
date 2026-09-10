import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stethoscope, HeartPulse, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DoctorWelcomeAnimationProps {
  onComplete: () => void;
  doctorName?: string;
  avatarUrl?: string;
}

export function DoctorWelcomeAnimation({
  onComplete,
  doctorName,
  avatarUrl
}: DoctorWelcomeAnimationProps) {
  const { user } = useAuth();
  const displayName = doctorName || user?.name || 'Dr. Oussama Belouar';
  const resolvedAvatar = avatarUrl || user?.avatarUrl || localStorage.getItem('ordocare_doctor_avatar') || undefined;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400; // 2.4s

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(onComplete, 200);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 bg-[#061b24]/90 backdrop-blur-md flex items-center justify-center p-4 selection:bg-teal-400 selection:text-slate-900"
      >
        {/* Ambient radial glows */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none"
        />

        {/* Floating Card */}
        <motion.div
          initial={{ scale: 0.85, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: -10, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 260
          }}
          className="relative z-10 bg-white/95 backdrop-blur-xl border border-teal-100/90 shadow-2xl rounded-3xl p-8 max-w-md w-full text-center space-y-6 overflow-hidden"
        >
          {/* Top Decorative Pulse wave */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
            <motion.div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 transition-all ease-linear"
            />
          </div>

          {/* Avatar / Stethoscope Crest */}
          <div className="relative inline-flex items-center justify-center mx-auto">
            {/* Pulsing rings */}
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-teal-400/30"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-teal-500/20"
            />

            <motion.div
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-xl shadow-teal-500/30 flex items-center justify-center border-4 border-white overflow-hidden"
            >
              {resolvedAvatar ? (
                <img
                  src={resolvedAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Stethoscope className="w-12 h-12 text-white drop-shadow-sm" />
              )}
            </motion.div>

            {/* Sparkle badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white border-2 border-white flex items-center justify-center shadow-md"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </div>

          {/* Greeting Typography */}
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold uppercase tracking-wider shadow-2xs"
            >
              <HeartPulse className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>Cabinet Médical Connecté</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
            >
              Bonjour Doctor !
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm font-semibold text-teal-700"
            >
              {displayName}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed pt-1"
            >
              Votre espace de travail clinique est prêt. Accès sécurisé aux dossiers patients, ordonnances et protocoles.
            </motion.p>
          </div>

          {/* Quick Info Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid grid-cols-2 gap-2.5 pt-1 text-left"
          >
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 uppercase">Données</p>
                <p className="text-[11px] font-semibold text-teal-800 truncate">Sécurisées</p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 uppercase">Consultations</p>
                <p className="text-[11px] font-semibold text-emerald-800 truncate">Prêtes</p>
              </div>
            </div>
          </motion.div>

          {/* Skip / Enter Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="pt-2"
          >
            <button
              type="button"
              onClick={onComplete}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Accéder au Tableau de Bord</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
