import React from 'react';
import { handleImageError } from './utils';
import { ImageFallbackSvg } from './icons';
import EditableText from '../../HealthBeauty/inline/EditableText';
import EditableImage from '../../HealthBeauty/inline/EditableImage';

/**
 * Circular Feature Ring Section component
 */
const CircularFeatureRingSection = ({ content, selectedColor, inlineEdit }) => {
  // Get image from content
  const imageContent = content.feature_image || content.lifestyle_image || '';
  
  // Get heading from content
  const headingContent = content.circular_features_heading || '';
  
  // Get features
  const feature1Name = content.circular_feature_1_name || '';
  const feature1Desc = content.circular_feature_1_desc || '';
  const feature2Name = content.circular_feature_2_name || '';
  const feature2Desc = content.circular_feature_2_desc || '';
  const feature3Name = content.circular_feature_3_name || '';
  const feature3Desc = content.circular_feature_3_desc || '';
  const feature4Name = content.circular_feature_4_name || '';
  const feature4Desc = content.circular_feature_4_desc || '';

  const features = [
    { name: feature1Name, desc: feature1Desc, _edit: { nameKey: 'circular_feature_1_name', descKey: 'circular_feature_1_desc' } },
    { name: feature2Name, desc: feature2Desc, _edit: { nameKey: 'circular_feature_2_name', descKey: 'circular_feature_2_desc' } },
    { name: feature3Name, desc: feature3Desc, _edit: { nameKey: 'circular_feature_3_name', descKey: 'circular_feature_3_desc' } },
    { name: feature4Name, desc: feature4Desc, _edit: { nameKey: 'circular_feature_4_name', descKey: 'circular_feature_4_desc' } }
  ].filter(item => item.name || item.desc); // Only include items with content

  const color = selectedColor || '#B86A14';
  const editEnabled = !!inlineEdit?.enabled;
  const imageKey = content?.__meta?.feature_image?.imageKey || 'feature_image';

  return (
    <div className="w-full pt-5 box-border overflow-hidden bg-white max-lg:py-8 max-lg:px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          {headingContent && (
            <EditableText
              enabled={editEnabled}
              label="Heading"
              badge="Text"
              value={headingContent}
              onSave={(newText) => inlineEdit?.setText?.('circular_features_heading', newText)}
            >
              <h3 
                className="text-xl font-bold mb-2 max-lg:text-xl"
                style={{ color }}
              >
                {headingContent}
              </h3>
            </EditableText>
          )}
        </div>

        {/* Circular Image - Top */}
        <div className="flex justify-center items-center mb-12 max-lg:mb-8">
          <div className="w-[280px] h-[280px] max-lg:w-[200px] max-lg:h-[200px] rounded-full overflow-hidden relative shadow-lg">
            <EditableImage
              enabled={editEnabled}
              label="Feature Image"
              badge="Image"
              src={imageContent || ''}
              alt={headingContent || 'Feature image'}
              imageKey={imageKey}
              pageId={inlineEdit?.pageId || null}
              referenceImages={content.reference_images || []}
              onSave={(newUrl) => inlineEdit?.setBodyImage?.(imageKey, newUrl)}
            >
              <div className="w-full h-full">
                {imageContent ? (
                  <img
                    src={imageContent}
                    alt={headingContent || 'Feature image'}
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

        {/* Timeline View - Desktop and Mobile */}
        {features.length > 0 && (
          <div className="relative px-5 max-lg:px-4 mt-4 w-full max-w-[600px] mx-auto">
            {/* Timeline line */}
            <div 
              className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 z-0"
              style={{
                backgroundColor: color
              }}
            />
            
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`relative flex items-center z-[1] min-h-[80px] mb-8 max-lg:mb-6 ${
                  index % 2 === 0 
                    ? 'flex-row justify-start pr-[50%]' 
                    : 'flex-row-reverse justify-start pl-[50%]'
                }`}
              >
                {/* Dot */}
                <div 
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 max-lg:w-3 max-lg:h-3 rounded-full border-[3px] border-white z-[2] flex-shrink-0"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 0 2px ${color}`
                  }}
                />
                
                {/* Content Box */}
                <div className="px-4 py-3 max-lg:px-3 max-lg:py-3 rounded-lg max-w-[280px] max-lg:max-w-[200px] text-center">
                  {feature.name && (
                    <EditableText
                      enabled={editEnabled}
                      label={`Feature ${index + 1} Name`}
                      badge="Text"
                      value={feature.name}
                      onSave={(newText) => inlineEdit?.setText?.(feature?._edit?.nameKey, newText)}
                    >
                      <h4 className="mb-1 text-base max-lg:text-sm font-semibold leading-tight text-gray-800">
                        {feature.name}
                      </h4>
                    </EditableText>
                  )}
                  {feature.desc && (
                    <EditableText
                      enabled={editEnabled}
                      label={`Feature ${index + 1} Description`}
                      badge="Text"
                      value={feature.desc}
                      onSave={(newText) => inlineEdit?.setText?.(feature?._edit?.descKey, newText)}
                    >
                      <p className="m-0 text-sm max-lg:text-xs leading-normal text-gray-600">
                        {feature.desc}
                      </p>
                    </EditableText>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularFeatureRingSection;

