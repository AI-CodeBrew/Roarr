import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { handleImageError, defaultContent } from './utils';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

/**
 * Real Reviews Section component
 */
const RealReviewsSection = ({ content, selectedColor, inlineEdit }) => {
  const [realReviewsIndex, setRealReviewsIndex] = useState(0);
  const reviews = content.real_reviews || defaultContent.realReviews;
  const editEnabled = !!inlineEdit?.enabled;

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '8px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ color: '#000000' }}>Real People, </span>
          <span style={{ color: selectedColor }}>Real Reviews</span>
        </h2>

        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
          <div
            style={{
              display: 'flex',
              transition: 'transform 0.3s ease-in-out',
              transform: `translateX(-${realReviewsIndex * 100}%)`
            }}
          >
            {reviews.map((review, index) => (
              <div key={index} style={{ width: '100%', flexShrink: 0, padding: '0 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <div style={{ aspectRatio: '1 / 1', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
                    <EditableImage
                      enabled={editEnabled}
                      label={`Review ${index + 1} Image`}
                      badge="Image"
                      src={review.image}
                      alt={review.name}
                      imageKey={review?._edit?.imageKey || `customer_review_image_${index + 1}`}
                      pageId={inlineEdit?.pageId || null}
                      referenceImages={content.reference_images || []}
                      onSave={(newUrl) => {
                        const k = review?._edit?.imageKey || `customer_review_image_${index + 1}`;
                        inlineEdit?.setBodyImage?.(k, newUrl);
                      }}
                    >
                      <div style={{ width: '100%', height: '100%' }}>
                        <img
                          src={review.image}
                          alt={review.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={handleImageError}
                        />
                      </div>
                    </EditableImage>
                  </div>

                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[...Array(review.rating || 5)].map((_, i) => (
                        <span key={i} style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
                      ))}
                    </div>

                    <EditableText
                      enabled={editEnabled}
                      label={`Review ${index + 1} Title`}
                      badge="Text"
                      value={review.title}
                      onSave={(newText) => {
                        const k = review?._edit?.titleKey || `reviewer_comment_${index + 1}`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>
                        {review.title}
                      </h3>
                    </EditableText>

                    <EditableText
                      enabled={editEnabled}
                      label={`Review ${index + 1} Comment`}
                      badge="Text"
                      value={review.comment}
                      onSave={(newText) => {
                        const k = review?._edit?.commentKey || `reviewer_comment_${index + 1}_detailed`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.625' }}>
                        {review.comment}
                      </p>
                    </EditableText>

                    <EditableText
                      enabled={editEnabled}
                      label={`Review ${index + 1} Name`}
                      badge="Text"
                      value={review.name}
                      onSave={(newText) => {
                        const k = review?._edit?.nameKey || `reviewer_name_${index + 1}`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <p style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>
                        - {review.name}
                      </p>
                    </EditableText>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {reviews.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setRealReviewsIndex(index)}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                  backgroundColor: index === realReviewsIndex ? '#000000' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer'
                }}
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

