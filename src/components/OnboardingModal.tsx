import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: '📸',
    title: 'Camera Access',
    description: 'Allow camera access to start. Your video stays local — nothing is uploaded.',
    visual: '🎥 → 🖥️',
  },
  {
    icon: '☝️',
    title: 'Draw Gesture',
    description: 'Raise your INDEX finger (keep middle finger down) to start drawing glowing strokes.',
    visual: '☝️ = ✏️ Draw',
  },
  {
    icon: '🖐️',
    title: 'Palm Erase',
    description: 'Open your palm (all fingers up) to act like a giant whiteboard eraser.',
    visual: '🖐️ = 🧹 Erase',
  },
  {
    icon: '✌️',
    title: 'Pointer Mode',
    description: 'Peace sign (index + middle up) to just point without drawing.',
    visual: '✌️ = 👆 Point',
  },
  {
    icon: '✊',
    title: 'Grab / Pause',
    description: 'Make a fist to pause drawing and move your hand freely without leaving a trail.',
    visual: '✊ = ⏸️ Pause',
  },
  {
    icon: '🖐️',
    title: 'Clear Canvas',
    description: 'Hold all fingers + thumb up for 2 seconds to clear the canvas.',
    visual: '🖐️ ×2s = 🗑️',
  },
  {
    icon: '👋',
    title: 'Swipe to Switch',
    description: 'Swipe your hand left/right with an open palm to switch between canvas tabs.',
    visual: '👋← →👋',
  },
  {
    icon: '⌨️',
    title: 'Keyboard Shortcuts',
    description: 'D=Draw, E=Eraser, P=Pointer, C=Clear, S=Save, Ctrl+Z=Undo, F=FPS, R=Record',
    visual: '⌨️ = ⚡',
  },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = React.useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('airsketch-ai-onboarded', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-panel p-8 max-w-md w-full"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="font-display text-2xl font-bold text-neon-cyan neon-text mb-1">
                AirSketch AI
              </h2>
              <p className="text-xs text-white/40 font-sans">Learn the gestures</p>
            </div>

            {/* Step content */}
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-center mb-8"
            >
              <div className="text-5xl mb-4">{steps[step].icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{steps[step].title}</h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                {steps[step].description}
              </p>
              <div
                className="inline-block px-4 py-2 rounded-lg text-sm font-mono"
                style={{
                  background: 'rgba(0,255,255,0.08)',
                  border: '1px solid rgba(0,255,255,0.2)',
                  color: '#00FFFF',
                }}
              >
                {steps[step].visual}
              </div>
            </motion.div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="w-2 h-2 rounded-full transition-all duration-200"
                  style={{
                    background: i === step ? '#00FFFF' : 'rgba(255,255,255,0.15)',
                    boxShadow: i === step ? '0 0 8px rgba(0,255,255,0.5)' : 'none',
                    width: i === step ? '20px' : '8px',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleDismiss} className="glass-button flex-1 justify-center text-white/40">
                Skip
              </button>
              <button
                onClick={handleNext}
                className="glass-button active flex-1 justify-center font-semibold"
              >
                {step < steps.length - 1 ? 'Next' : "Let's Draw!"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingModal;
