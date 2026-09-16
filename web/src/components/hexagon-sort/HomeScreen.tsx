import React from 'react';
import { motion } from 'framer-motion';
import { UserProfile } from '@/lib/types';
import { HexGameProfile } from '@/lib/hexagon/types';
import { playTap } from '@/lib/soundEffects';

interface HomeScreenProps {
  user: UserProfile;
  profile: HexGameProfile;
  onPlay: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, profile, onPlay, onOpenShop, onOpenSettings }) => {
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1c0f45] to-[#2a1b54] text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#00ffff] to-[#1e90ff] rounded-full p-0.5">
            <div className="w-full h-full bg-[#1c0f45] rounded-full flex items-center justify-center font-bold text-lg">
              {user.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-sm">{user.display_name || user.first_name}</h2>
            <p className="text-xs text-[#00ffff]">Level {profile.currentLevel}</p>
          </div>
        </div>
        <button onClick={() => { playTap(); onOpenSettings(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          ⚙️
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#8a2be2]/40 to-[#401f80]/40 border border-[#8a2be2]/30 rounded-3xl p-6 mb-6 text-center shadow-[0_0_30px_rgba(138,43,226,0.2)]">
        <h1 className="text-2xl font-black mb-2">HEXAGON BLOCK SORT</h1>
        <p className="text-sm text-white/70 mb-6">Continue Level {profile.currentLevel}</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { playTap(); onPlay(); }}
          className="w-full py-4 rounded-xl bg-[#00ffff] text-[#1c0f45] font-black text-lg shadow-[0_0_15px_rgba(0,255,255,0.5)]"
        >
          PLAY
        </motion.button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        <MenuButton icon="📅" title="Daily Challenge" onClick={() => { playTap(); onPlay(); }} />
        <MenuButton icon="🏆" title="Leaderboard" onClick={() => { playTap(); }} />
        <MenuButton icon="🏅" title="Achievements" onClick={() => { playTap(); }} />
        <MenuButton icon="🛒" title="Shop" onClick={() => { playTap(); onOpenShop(); }} />
      </div>
    </div>
  );
};

const MenuButton = ({ icon, title, onClick }: { icon: string, title: string, onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
  >
    <span className="text-3xl">{icon}</span>
    <span className="text-sm font-bold text-white/80">{title}</span>
  </motion.button>
);
