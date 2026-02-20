import { Sparkles } from 'lucide-react';

export default function RunningBanner() {
  return (
    <div className="w-full bg-dark-maroon border-b border-gold/30 overflow-hidden relative">
      <div className="banner-scroll">
        <div className="banner-content flex items-center gap-8 py-3 px-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="h-4 w-4 text-gold-shimmer" />
              <span className="text-gold-shimmer font-medium tracking-wide">
                Lab Grown Diamonds
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
