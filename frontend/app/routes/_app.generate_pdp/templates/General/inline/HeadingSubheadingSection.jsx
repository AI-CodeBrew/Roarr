import React from 'react';
import { defaultContent } from './utils';

/**
 * Heading Subheading Section component
 */
const HeadingSubheadingSection = ({ content, selectedColor }) => {
  return (
    <div className='pb-6 pt-5' style={{ backgroundColor: 'transparent' }}>
      <div className='gap-x-2' style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 className='mb-4' style={{ fontSize: '22px', fontWeight: 'bold', color: selectedColor }}>
          {content.heading || defaultContent.heading}
        </h2>
        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.625' }}>
          {content.subheading || defaultContent.subheading}
        </p>
      </div>
    </div>
  );
};

export default HeadingSubheadingSection;

