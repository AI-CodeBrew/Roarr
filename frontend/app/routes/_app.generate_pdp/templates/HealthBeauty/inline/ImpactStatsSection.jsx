import React from 'react';
import { handleImageError, defaultContent, hexToRgba } from './utils';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

/**
 * Impact Stats Section component
 */
const ImpactStatsSection = ({ content, selectedColor, inlineEdit }) => {
  const impactStats = content.impact_stats || defaultContent.impactStats;
  const impactStatsHeading = content.impact_stats_heading || defaultContent.impactStatsHeading;
  const editEnabled = !!inlineEdit?.enabled;
  const headingKey = content?.__editKeys?.impact_stats_heading || 'stats_section_heading';
  const impactImageKey = content?.__meta?.impact_image?.imageKey || 'problem_solving_image';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: '16px', backgroundColor: selectedColor }}>
        <EditableText
          enabled={editEnabled}
          label="Impact Stats Heading"
          badge="Text"
          value={impactStatsHeading}
          onSave={(newText) => inlineEdit?.setText?.(headingKey, newText)}
        >
          <h2 className="text-xl font-bold text-center" style={{ color: '#ffffff' }}>
            {impactStatsHeading}
          </h2>
        </EditableText>
      </div>
      <div className="px-4 py-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 gap-2 items-center mt-4">
            <div>
              <div className="rounded-lg overflow-hidden bg-gray-50 aspect-square">
                <EditableImage
                  enabled={editEnabled}
                  label="Impact Image"
                  badge="Image"
                  src={content.impact_image || ''}
                  alt="Product impact before and after"
                  imageKey={impactImageKey}
                  pageId={inlineEdit?.pageId || null}
                  referenceImages={content.reference_images || []}
                  onSave={(newUrl) => inlineEdit?.setBodyImage?.(impactImageKey, newUrl)}
                >
                  <div className="w-full h-full">
                    <img
                      src={content.impact_image || ''}
                      alt="Product impact before and after"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                </EditableImage>
              </div>
            </div>

            <div className="flex py-4 flex-col gap-2">
              {impactStats.map((stat, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 ${index < 2 ? 'pb-6 border-b border-gray-100' : ''}`}
                >
                  <div className="flex-shrink-0">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={selectedColor}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - stat.percentage / 100)}`}
                        />
                      </svg>
                      <span className="absolute text-base font-bold" style={{ color: selectedColor }}>
                        {stat.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <EditableText
                      enabled={editEnabled}
                      label={`Stat ${index + 1} Title`}
                      badge="Text"
                      value={stat.title}
                      onSave={(newText) => {
                        const k = stat?._edit?.titleKey || `stats_section_point_${index + 1}_heading`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <h3 className="text-base font-bold text-black">
                        {stat.title}
                      </h3>
                    </EditableText>

                    <EditableText
                      enabled={editEnabled}
                      label={`Stat ${index + 1} Description`}
                      badge="Text"
                      value={stat.description}
                      onSave={(newText) => {
                        const k = stat?._edit?.descKey || `stats_section_point_${index + 1}_desc`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {stat.description}
                      </p>
                    </EditableText>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactStatsSection;

