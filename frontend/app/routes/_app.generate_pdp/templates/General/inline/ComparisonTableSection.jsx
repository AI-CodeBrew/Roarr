import React from 'react';
import { defaultContent, hexToRgba } from './utils';
import EditableText from '../../HealthBeauty/inline/EditableText';

/**
 * Comparison Table Section component
 */
const ComparisonTableSection = ({ content, selectedColor = '#B86A14', inlineEdit }) => {
  const comparisonFeatures = content.comparison_features || defaultContent.comparisonFeatures;
  const defaultComparisonSubheading = defaultContent.comparisonSubheading;
  const editEnabled = !!inlineEdit?.enabled;
  const subheadingKey = content?.__editKeys?.comparison_subheading || 'what_set_us_apart_subheading';

  return (
    <div className="px-4 py-8" style={{ backgroundColor: hexToRgba(selectedColor, 0.1) }}>
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col justify-center items-center gap-4 text-center">
            <h2 className="text-xl font-bold text-black">
              What Sets <span style={{ color: selectedColor }}>US Apart</span>
            </h2>
            <EditableText
              enabled={editEnabled}
              label="Comparison Subheading"
              badge="Text"
              value={content.comparison_subheading || defaultComparisonSubheading}
              onSave={(newText) => inlineEdit?.setText?.(subheadingKey, newText)}
            >
              <p className="text-xs text-gray-700">
                {content.comparison_subheading || defaultComparisonSubheading}
              </p>
            </EditableText>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-bold text-xs text-black">Features</th>
                    <th className="text-center py-4 px-6 font-bold text-black">Us</th>
                    <th className="text-center py-4 px-6 font-bold text-xs text-black">Others</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index, array) => (
                    <tr key={index} className={index < array.length - 1 ? 'border-b border-gray-100' : ''}>
                      <td className="py-4 px-6 text-xs text-gray-900 font-medium">
                        <EditableText
                          enabled={editEnabled}
                          label={`Feature ${index + 1}`}
                          badge="Text"
                          value={item.feature}
                          onSave={(newText) => {
                            const k = item?._edit?.featureKey || `what_sets_us_apart_feature_${index + 1}`;
                            inlineEdit?.setText?.(k, newText);
                          }}
                        >
                          <span>{item.feature}</span>
                        </EditableText>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {item.us ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 13l4 4 10-10" />
                            </svg>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {item.others ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 13l4 4 10-10" />
                            </svg>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTableSection;

