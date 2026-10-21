import React, { useState } from 'react';
import { ImageFallbackSvg } from './icons';
import { handleImageError } from './utils';
import EditableImage from '../../HealthBeauty/inline/EditableImage';

/**
 * Loved by Everyone Section component
 */
const LovedByEveryoneSection = ({ content, inlineEdit }) => {
  const [lovedByEveryoneIndex, setLovedByEveryoneIndex] = useState(0);
  const editEnabled = !!inlineEdit?.enabled;
  const imagesMeta = Array.isArray(content?.__meta?.loved_by_images) ? content.__meta.loved_by_images : null;
  const images = imagesMeta
    ? imagesMeta.map((x) => x.url).filter(Boolean)
    : (content.loved_by_images && content.loved_by_images.length > 0 ? content.loved_by_images : ['', '', '', '']);

  return (
    <div className="bg-white px-4 py-4">
      <div className="max-w-[1280px] mx-auto">
        <h2 className="text-xl font-bold text-black text-center mb-4">
          Loved by Everyone!
        </h2>

        {/* Mobile Carousel */}
        <div className="block">
          <div className="relative w-full overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${lovedByEveryoneIndex * (100 / images.length)}%)`,
                width: `${images.length * 100}%`
              }}
            >
              {images.map((imageUrl, index) => {
                const imageKey = imagesMeta?.[index]?.key || `happy_customer_image_${index + 1}`;
                return (
                  <div key={index} className="flex-shrink-0 box-border" style={{ width: `${100 / images.length}%` }}>
                    <div className="aspect-square rounded-lg overflow-hidden relative">
                      <EditableImage
                        enabled={editEnabled}
                        label={`Loved By Image ${index + 1}`}
                        badge="Image"
                        src={imageUrl || ''}
                        alt={`Loved by everyone ${index + 1}`}
                        imageKey={imageKey}
                        pageId={inlineEdit?.pageId || null}
                        referenceImages={content.reference_images || []}
                        onSave={(newUrl) => inlineEdit?.setBodyImage?.(imageKey, newUrl)}
                      >
                        <div className="w-full h-full">
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
                      </EditableImage>
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
};

export default LovedByEveryoneSection;

