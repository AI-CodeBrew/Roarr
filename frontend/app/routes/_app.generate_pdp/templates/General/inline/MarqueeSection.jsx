import React from 'react';
import EditableText from '../../HealthBeauty/inline/EditableText';

/**
 * Marquee Section component - Infinite scrolling text
 */
const MarqueeSection = ({ content, selectedColor, inlineEdit }) => {
  // Try multiple possible property name formats
  const marqueeText1 = content.marquee_text_1 || content.marqueeText1 || content['marquee_text_1'] || '';
  const marqueeText2 = content.marquee_text_2 || content.marqueeText2 || content['marquee_text_2'] || '';
  const marqueeText3 = content.marquee_text_3 || content.marqueeText3 || content['marquee_text_3'] || '';

  const editEnabled = !!inlineEdit?.enabled;

  // Combine all text items with keys, filtering out empty ones
  const marqueeEntries = [
    { key: 'marquee_text_1', value: marqueeText1 },
    { key: 'marquee_text_2', value: marqueeText2 },
    { key: 'marquee_text_3', value: marqueeText3 },
  ].filter(({ value }) => {
    if (!value) return false;
    const str = String(value).trim();
    return str !== '' && str !== 'null' && str !== 'undefined';
  });

  // If no items, return empty div to maintain layout
  if (marqueeEntries.length === 0) {
    return (
      <div
        style={{
          backgroundColor: selectedColor,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          padding: '12px 0',
          position: 'relative',
          minHeight: '40px'
        }}
      />
    );
  }

  // Duplicate items for seamless infinite scroll
  const duplicatedItems = [...marqueeEntries, ...marqueeEntries];

  return (
    <div
      style={{
        backgroundColor: selectedColor,
        overflow: 'hidden',
        padding: '12px 0',
        position: 'relative',
        width: '100%'
      }}
    >
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marquee-scroll 30s linear infinite;
          width: max-content;
        }
        .marquee-item {
          display: inline-block;
          flex-shrink: 0;
          white-space: nowrap;
          padding-right: 40px;
        }
      `}</style>
      <div className="marquee-track">
        {duplicatedItems.map((entry, index) => (
          <EditableText
            key={`${entry.key}-${index}`}
            enabled={editEnabled}
            label="Marquee Text"
            badge="Text"
            value={entry.value}
            onSave={(newText) => inlineEdit?.setText?.(entry.key, newText)}
          >
            <span
              className="marquee-item"
              style={{
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'normal'
              }}
            >
              {entry.value}
            </span>
          </EditableText>
        ))}
      </div>
    </div>
  );
};

export default MarqueeSection;

