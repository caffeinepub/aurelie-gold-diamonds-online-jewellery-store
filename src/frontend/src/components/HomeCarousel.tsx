import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetCarouselItems } from '../hooks/useQueries';

export default function HomeCarousel() {
  const { data: carouselItems = [], isLoading } = useGetCarouselItems();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const handleItemClick = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-dark-maroon/50 animate-pulse rounded-lg" />
    );
  }

  if (carouselItems.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden group">
      {/* Carousel Images */}
      <div className="relative w-full h-full">
        {carouselItems.map((item, index) => (
          <div
            key={item.id.toString()}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="w-full h-full cursor-pointer"
              onClick={() => handleItemClick(item.url)}
            >
              <img
                src={item.image.getDirectURL()}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-maroon/80 via-transparent to-transparent" />
              {item.title && (
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-2xl md:text-4xl font-bold text-gold-shimmer drop-shadow-lg">
                    {item.title}
                  </h3>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {carouselItems.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-dark-maroon/80 hover:bg-dark-maroon text-gold hover:text-gold-shimmer opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-dark-maroon/80 hover:bg-dark-maroon text-gold hover:text-gold-shimmer opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Pagination Dots */}
      {carouselItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-gold w-8'
                  : 'bg-gold/50 hover:bg-gold/70'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
