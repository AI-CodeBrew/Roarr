import React, { useState } from 'react';
import { ImageFallbackSvg } from './icons';
import { handleImageError } from './utils';

/**
 * Proven Results Section component
 */
const ProvenResultsSection = ({ content }) => {
  const [lovedByEveryoneIndex, setLovedByEveryoneIndex] = useState(0);
  const images = content.loved_by_images && content.loved_by_images.length > 0 
    ? content.loved_by_images 
    : ['', '', '', ''];

  return (
    <div className="bg-white px-4">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-xl font-bold text-black text-center mb-4">
          Proven Results
        </h2>

        <div className="relative w-full overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${lovedByEveryoneIndex * (100 / images.length)}%)`,
              width: `${images.length * 100}%`
            }}
          >
            {images.map((imageUrl, index) => (
              <div key={index} className="flex-shrink-0 box-border" style={{ width: `${100 / images.length}%` }}>
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Loved by everyone ${index + 1}`}
                      className="w-full h-full object-cover block"
                      onError={handleImageError}
                    />
                  ) : (
                    <ImageFallbackSvg />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setLovedByEveryoneIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 border-none cursor-pointer ${
                  index === lovedByEveryoneIndex ? 'bg-black' : 'bg-gray-300'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvenResultsSection;

