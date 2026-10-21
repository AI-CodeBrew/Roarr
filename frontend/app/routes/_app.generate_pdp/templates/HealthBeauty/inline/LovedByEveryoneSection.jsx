import React, { useState } from 'react';
import { ImageFallbackSvg } from './icons';
import { handleImageError } from './utils';
import EditableImage from './EditableImage';

/**
 * Loved by Everyone Section component
 */
const LovedByEveryoneSection = ({ content, inlineEdit }) => {
  const [lovedByEveryoneIndex, setLovedByEveryoneIndex] = useState(0);
  const editEnabled = !!inlineEdit?.enabled;
  const imagesMeta = Array.isArray(content?.__meta?.loved_by_images)
    ? content.__meta.loved_by_images
    : null;
  const images = imagesMeta
    ? imagesMeta.map((x) => x.url).filter(Boolean)
    : (content.loved_by_images && content.loved_by_images.length > 0
      ? content.loved_by_images
      : ['', '', '', '']);

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '8px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: '16px' }}>
          Loved by Everyone!
        </h2>

        {/* Mobile Carousel */}
        <div style={{ display: 'block' }}>
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
            <div 
              style={{
                display: 'flex',
                transition: 'transform 0.3s ease-in-out',
                transform: `translateX(-${lovedByEveryoneIndex * 100}%)`
              }}
            >
              {images.map((imageUrl, index) => {
                const imageKey = imagesMeta?.[index]?.key || `happy_customer_image_${index + 1}`;
                return (
                <div key={index} style={{ width: '100%', flexShrink: 0 }}>
                  <div style={{ aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
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
                      <div style={{ width: '100%', height: '100%' }}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`Loved by everyone ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setLovedByEveryoneIndex(index)}
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                    backgroundColor: index === lovedByEveryoneIndex ? '#000000' : '#d1d5db',
                    border: 'none',
                    cursor: 'pointer'
                  }}
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

