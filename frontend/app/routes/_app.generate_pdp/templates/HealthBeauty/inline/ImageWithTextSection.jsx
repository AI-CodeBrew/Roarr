import React from 'react';
import { handleImageError, defaultContent, darkenColor } from './utils';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

/**
 * Image with Text Section component
 */
const ImageWithTextSection = ({ content, selectedColor, inlineEdit }) => {
  const defaultImageTextHeading = defaultContent.imageTextHeading;
  const defaultImageTextDescription = defaultContent.imageTextDescription;
  const editEnabled = !!inlineEdit?.enabled;
  const imageKey = content?.__meta?.product_impact_image?.imageKey || 'product_impact_image';
  const headingKey = content?.__editKeys?.image_text_heading || 'high_impacting_product_heading';
  const descKey = content?.__editKeys?.image_text_description || 'high_impacting_product_subheading';

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '8px 16px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '32px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
              <EditableImage
                enabled={editEnabled}
                label="Lifestyle Image"
                badge="Image"
                src={content.lifestyle_image || content.image_with_text_image || ''}
                alt="Lifestyle"
                imageKey={imageKey}
                pageId={inlineEdit?.pageId || null}
                referenceImages={content.reference_images || []}
                onSave={(newUrl) => inlineEdit?.setBodyImage?.(imageKey, newUrl)}
              >
                <div style={{ width: '100%', height: '100%' }}>
                  <img
                    src={content.lifestyle_image || content.image_with_text_image || ''}
                    alt="Lifestyle"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={handleImageError}
                  />
                </div>
              </EditableImage>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px', textAlign: 'center' }}>
            <EditableText
              enabled={editEnabled}
              label="Image With Text Heading"
              badge="Text"
              value={content.image_text_heading || defaultImageTextHeading}
              onSave={(newText) => inlineEdit?.setText?.(headingKey, newText)}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000000' }}>
                {content.image_text_heading || defaultImageTextHeading}
              </h2>
            </EditableText>

            <EditableText
              enabled={editEnabled}
              label="Image With Text Description"
              badge="Text"
              value={content.image_text_description || defaultImageTextDescription}
              onSave={(newText) => inlineEdit?.setText?.(descKey, newText)}
            >
              <p style={{ fontSize: '12px', color: '#374151', lineHeight: '1.625' }}>
                {content.image_text_description || defaultImageTextDescription}
              </p>
            </EditableText>

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
                cursor: 'pointer',
                margin: '0 auto'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = darkenColor(selectedColor)}
              onMouseLeave={(e) => e.target.style.backgroundColor = selectedColor}
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageWithTextSection;

