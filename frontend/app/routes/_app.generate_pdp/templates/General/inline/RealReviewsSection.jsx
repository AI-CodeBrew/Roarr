import React, { useState } from 'react';
import { handleImageError, defaultContent } from './utils';

/**
 * Real Reviews Section component
 */
const RealReviewsSection = ({ content, selectedColor }) => {
  const [realReviewsIndex, setRealReviewsIndex] = useState(0);
  const realReviews = content.real_reviews || defaultContent.realReviews;

  return (
    <div className="bg-white px-4 py-2">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-xl font-bold text-center mb-4">
          <span className="text-black">Real People, </span>
          <span style={{ color: selectedColor }}>Real Reviews</span>
        </h2>

        <div className="relative w-full overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${realReviewsIndex * (100 / realReviews.length)}%)`,
              width: `${realReviews.length * 100}%`
            }}
          >
            {realReviews.map((review, index) => (
              <div key={index} className="flex-shrink-0 px-2 box-border" style={{ width: `${100 / realReviews.length}%` }}>
                <div className="flex flex-col bg-white rounded-lg overflow-hidden border border-gray-200 w-full box-border">
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="w-full h-full object-cover block"
                      onError={handleImageError}
                    />
                  </div>

                  <div className="p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-xs">★</span>
                      ))}
                    </div>

                    <h3 className="text-xs font-bold text-black m-0">
                      {review.title}
                    </h3>

                    <p className="text-xs text-gray-700 leading-relaxed m-0">
                      {review.comment}
                    </p>

                    <p className="text-xs font-medium text-gray-900 m-0">
                      - {review.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {realReviews.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {realReviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setRealReviewsIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 border-none cursor-pointer ${
                  index === realReviewsIndex ? 'bg-black' : 'bg-gray-300'
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealReviewsSection;

