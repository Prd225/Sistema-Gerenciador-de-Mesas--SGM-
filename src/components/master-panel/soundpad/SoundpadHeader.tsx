import { Music } from 'lucide-react';

export default function SoundpadHeader() {
  return (
    <div className="flex items-center gap-2 p-3 bg-[#202024] border-b border-[#323238] shrink-0">
      <Music className="w-5 h-5 text-[#8257e5]" />
      <h2 className="text-[#e1e1e6] font-semibold text-sm uppercase tracking-wider">Soundpad</h2>
    </div>
  );
}
