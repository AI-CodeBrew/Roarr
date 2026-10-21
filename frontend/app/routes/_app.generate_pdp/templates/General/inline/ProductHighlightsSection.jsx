import React from 'react';
import { ImageFallbackSvg } from './icons';
import { handleImageError } from './utils';

/**
 * Product Highlights Section component
 */
const ProductHighlightsSection = ({ content }) => {
  const productHighlights = content.product_highlights || [
    { image: '', heading: 'Heading 1', subheading: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { image: '', heading: 'Heading 2', subheading: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { image: '', heading: 'Heading 3', subheading: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { image: '', heading: 'Heading 4', subheading: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
  ];

  return (
    <div className="bg-white px-4 py-2">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-xl font-bold text-black text-center mb-4">
          {content.product_highlights_heading || 'Product Highlights'}
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {productHighlights.map((highlight, index) => (
            <div key={index} className="flex flex-col gap-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
                {highlight.image ? (
                  <img
                    src={highlight.image}
                    alt={highlight.heading}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <ImageFallbackSvg />
                )}
              </div>

              <h3 className="text-xs font-bold text-black text-center">
                {highlight.heading}
              </h3>

              <p className="text-xs text-gray-700 text-center leading-relaxed">
                {highlight.subheading}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductHighlightsSection;

