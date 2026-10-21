import React from 'react';
import { defaultContent } from './utils';
import EditableText from './EditableText';

/**
 * Heading Subheading Section component
 */
const HeadingSubheadingSection = ({ content, selectedColor, inlineEdit }) => {
  const editEnabled = !!inlineEdit?.enabled;
  const headingKey = content?.__editKeys?.heading || 'high_impacting_product_heading';
  const subheadingKey = content?.__editKeys?.subheading || 'high_impacting_product_subheading';

  return (
    <div className='px-4 pb-6 pt-5' style={{ backgroundColor: 'transparent' }}>
      <div className='gap-x-2' style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <EditableText
          enabled={editEnabled}
          label="Heading"
          badge="Text"
          value={content.heading || defaultContent.heading}
          onSave={(newText) => inlineEdit?.setText?.(headingKey, newText)}
        >
          <h2 className='mb-4' style={{ fontSize: '22px', fontWeight: 'bold', color: selectedColor }}>
            {content.heading || defaultContent.heading}
          </h2>
        </EditableText>

        <EditableText
          enabled={editEnabled}
          label="Subheading"
          badge="Text"
          value={content.subheading || defaultContent.subheading}
          onSave={(newText) => inlineEdit?.setText?.(subheadingKey, newText)}
        >
          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.625' }}>
            {content.subheading || defaultContent.subheading}
          </p>
        </EditableText>
      </div>
    </div>
  );
};

export default HeadingSubheadingSection;

