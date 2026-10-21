import React, { useState, useRef } from 'react';
import { handleImageError, defaultContent, hexToRgba } from './utils';
import { ImageFallbackSvg } from './icons';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

/**
 * Before & After Section component with interactive slider
 */
const BeforeAfterSection = ({ content, selectedColor, darkenColor: darkenColorFn, inlineEdit }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const editEnabled = !!inlineEdit?.enabled;

  const heading = content.before_after_heading || content.beforeAfterHeading || 'Transform Your Lips';

  // Build before items from individual fields - try multiple possible property name formats
  const beforeItems = [
    content.before_use_issue_1 || content.beforeUseIssue1 || content['before_use_issue_1'],
    content.before_use_issue_2 || content.beforeUseIssue2 || content['before_use_issue_2'],
    content.before_use_issue_3 || content.beforeUseIssue3 || content['before_use_issue_3']
  ].filter(item => {
    if (!item) return false;
    const str = String(item).trim();
    return str !== '' && str !== 'null' && str !== 'undefined';
  });

  // Build after items from individual fields - try multiple possible property name formats
  const afterItems = [
    content.after_use_benefit_1 || content.afterUseBenefit1 || content['after_use_benefit_1'],
    content.after_use_benefit_2 || content.afterUseBenefit2 || content['after_use_benefit_2'],
    content.after_use_benefit_3 || content.afterUseBenefit3 || content['after_use_benefit_3']
  ].filter(item => {
    if (!item) return false;
    const str = String(item).trim();
    return str !== '' && str !== 'null' && str !== 'undefined';
  });

  const handleMouseMove = (e) => {
    if (isDragging && sliderRef.current) {
      e.preventDefault();
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && sliderRef.current) {
      e.preventDefault();
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  };

  const handleClick = (e) => {
    if (!isDragging && sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  };

  return (
    <div className='p-6 mt-4' style={{ backgroundColor: hexToRgba(selectedColor, 0.1), padding: '24px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Title */}
          <EditableText
            enabled={editEnabled}
            label="Before & After Heading"
            badge="Text"
            value={heading}
            onSave={(newText) => inlineEdit?.setText?.('before_after_heading', newText)}
          >
            <h2 className='mt-4' style={{ fontSize: '22px', fontWeight: 'bold', color: '#000000', textAlign: 'center', margin: 0 }}>
              {heading}
            </h2>
          </EditableText>

          {/* Before & After Lists */}
          <div className='p-2' style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Before Column */}
            <div style={{ textAlign: 'center', gap: '8px' }}>
              <h3 className='mb-8' style={{ fontSize: '16px', fontWeight: '800', color: '#000000', marginBottom: '12px' }}>Before</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {beforeItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <div className="bg-red-100 rounded-full p-1"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4L4 12M4 4L12 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    </div>
                    <EditableText
                      enabled={editEnabled}
                      label={`Before Issue ${index + 1}`}
                      badge="Text"
                      value={item}
                      onSave={(newText) => inlineEdit?.setText?.(`before_use_issue_${index + 1}`, newText)}
                    >
                      <span style={{ fontSize: '14px', color: '#374151' }}>{item}</span>
                    </EditableText>
                  </div>
                ))}
              </div>
            </div>

            {/* After Column */}
            <div style={{ textAlign: 'center', gap: '8px' }}>
              <h3 className='mb-8' style={{ fontSize: '16px', fontWeight: '800', color: '#000000', marginBottom: '12px' }}>After</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {afterItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <div className="bg-green-100 rounded-full p-1"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    </div>
                    <EditableText
                      enabled={editEnabled}
                      label={`After Benefit ${index + 1}`}
                      badge="Text"
                      value={item}
                      onSave={(newText) => inlineEdit?.setText?.(`after_use_benefit_${index + 1}`, newText)}
                    >
                      <span style={{ fontSize: '14px', color: '#374151' }}>{item}</span>
                    </EditableText>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              style={{
                width: 'auto',
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'background-color 0.2s',
                backgroundColor: selectedColor,
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = darkenColorFn(selectedColor)}
              onMouseLeave={(e) => e.target.style.backgroundColor = selectedColor}
            >
              Try by Yourself
            </button>
          </div>

          {/* Right Panel - Before & After Images with Slider */}
          <div style={{ position: 'relative' }}>
            <div
              ref={sliderRef}
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f9fafb',
                cursor: 'ew-resize',
                userSelect: 'none'
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsDragging(false)}
              onClick={handleClick}
            >
              {/* After Image - Full image (base, always visible) */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: editEnabled ? 'auto' : 'none' }}>
                <EditableImage
                  enabled={editEnabled}
                  label="After Image"
                  badge="Image"
                  src={content.after_image || ''}
                  alt="After"
                  imageKey={content?.__meta?.after_image?.imageKey || 'after_use_image'}
                  pageId={inlineEdit?.pageId || null}
                  referenceImages={content.reference_images || []}
                  onSave={(newUrl) => inlineEdit?.setBodyImage?.(content?.__meta?.after_image?.imageKey || 'after_use_image', newUrl)}
                >
                  <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                    {content.after_image ? (
                      <img
                        src={content.after_image}
                        alt="After"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        draggable={false}
                        onError={handleImageError}
                      />
                    ) : (
                      <ImageFallbackSvg />
                    )}
                  </div>
                </EditableImage>
              </div>

              {/* Before Image - Full image, revealed from left by slider */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: editEnabled ? 'auto' : 'none',
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
                }}
              >
                <EditableImage
                  enabled={editEnabled}
                  label="Before Image"
                  badge="Image"
                  src={content.before_image || ''}
                  alt="Before"
                  imageKey={content?.__meta?.before_image?.imageKey || 'before_use_image'}
                  pageId={inlineEdit?.pageId || null}
                  referenceImages={content.reference_images || []}
                  onSave={(newUrl) => inlineEdit?.setBodyImage?.(content?.__meta?.before_image?.imageKey || 'before_use_image', newUrl)}
                >
                  <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                    {content.before_image ? (
                      <img
                        src={content.before_image}
                        alt="Before"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        draggable={false}
                        onError={handleImageError}
                      />
                    ) : (
                      <ImageFallbackSvg />
                    )}
                  </div>
                </EditableImage>
              </div>

              {/* Slider Handle */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  zIndex: 10,
                  pointerEvents: 'none',
                  left: `${sliderPosition}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div style={{ width: '2px', height: '100%', backgroundColor: '#ffffff', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}></div>
                {/* Slider Handle Circle */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #EF4444',
                    pointerEvents: 'auto',
                    cursor: 'ew-resize'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6L6 3M3 6L6 9" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 6L6 3M9 6L6 9" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: selectedColor, color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', zIndex: 20, pointerEvents: 'none' }}>
                Before
              </div>
              <div style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: selectedColor, color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', zIndex: 20, pointerEvents: 'none' }}>
                After
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSection;

