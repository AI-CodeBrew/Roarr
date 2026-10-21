import React from 'react';
import { handleImageError } from './utils';
import { ImageFallbackSvg } from './icons';
import EditableText from '../../HealthBeauty/inline/EditableText';
import EditableImage from '../../HealthBeauty/inline/EditableImage';

/**
 * Creative Sassy Image with Text Section component
 * Based on the image-with-text.liquid block structure
 */
const CreativeSassyImageWithTextSection = ({ content, selectedColor, inlineEdit }) => {
  // Get image from content (product_impact_image or fallback)
  const imageContent = content.product_impact_image || content.lifestyle_image || content.image_with_text_image || '';
  // Get heading and subheadings from content
  const headingContent = content.creative_sassy_product_heading || content.image_text_heading || '';
  const editEnabled = !!inlineEdit?.enabled;
  const imageKey = content?.__meta?.product_impact_image?.imageKey || 'product_impact_image';

  const subheading1 = content.creative_sassy_product_subheading_1 || '';
  const subheading1Desc = content.creative_sassy_product_subheading_1_description || '';
  const subheading2 = content.creative_sassy_product_subheading_2 || '';
  const subheading2Desc = content.creative_sassy_product_subheading_2_description || '';
  const subheading3 = content.creative_sassy_product_subheading_3 || '';
  const subheading3Desc = content.creative_sassy_product_subheading_3_description || '';
  const subheading4 = content.creative_sassy_product_subheading_4 || '';
  const subheading4Desc = content.creative_sassy_product_subheading_4_description || '';

  const subheadings = [
    {
      heading: subheading1,
      desc: subheading1Desc,
      _edit: { headingKey: 'creative_sassy_product_subheading_1', descKey: 'creative_sassy_product_subheading_1_description' },
    },
    {
      heading: subheading2,
      desc: subheading2Desc,
      _edit: { headingKey: 'creative_sassy_product_subheading_2', descKey: 'creative_sassy_product_subheading_2_description' },
    },
    {
      heading: subheading3,
      desc: subheading3Desc,
      _edit: { headingKey: 'creative_sassy_product_subheading_3', descKey: 'creative_sassy_product_subheading_3_description' },
    },
    {
      heading: subheading4,
      desc: subheading4Desc,
      _edit: { headingKey: 'creative_sassy_product_subheading_4', descKey: 'creative_sassy_product_subheading_4_description' },
    }
  ].filter(item => item.heading); // Only include items with a heading

  return (
    <>
      <style>{`
        .creative-sassy-container {
          display: flex;
          width: 100%;
          flex-direction: column;
        }
        .creative-sassy-left {
          width: 100%;
          overflow: hidden;
          order: 1;
        }
        .creative-sassy-left img {
          width: 100%;
          height: auto;
          object-fit: cover;
          display: block;
          min-height: 300px;
        }
        .creative-sassy-right {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          box-sizing: border-box;
          order: 2;
        }
        @media (min-width: 768px) {
          .creative-sassy-container {
            flex-direction: row;
            max-height: 500px;
          }
          .creative-sassy-left {
            width: 50%;
            order: 1;
          }
          .creative-sassy-left img {
            height: 100%;
            min-height: auto;
          }
          .creative-sassy-right {
            width: 50%;
            padding: 30px 24px;
            order: 2;
          }
        }
      `}</style>
      <div className="my-2 bg-white flex flex-col h-full w-full p-0 box-border">
        <div className="flex flex-col w-full">
          {/* Image - First in mobile */}
          <div className=" flex h-full w-full">
            <EditableImage
              enabled={editEnabled}
              label="Section Image"
              badge="Image"
              src={imageContent || ''}
              alt={headingContent || 'Product image'}
              imageKey={imageKey}
              pageId={inlineEdit?.pageId || null}
              referenceImages={content.reference_images || []}
              onSave={(newUrl) => inlineEdit?.setBodyImage?.(imageKey, newUrl)}
            >
              <div className="w-full h-full">
                {imageContent ? (
                  <img
                    src={imageContent}
                    alt={headingContent || 'Product image'}
                    onError={handleImageError}
                  />
                ) : (
                  <ImageFallbackSvg />
                )}
              </div>
            </EditableImage>
          </div>

          {/* Text Content - Second in mobile */}
          <div className="w-full flex h-full p-5"
            style={{
              backgroundColor: selectedColor || '#B86A14'
            }}>
            <div style={{
              textAlign: 'center',
              width: '100%',
              maxWidth: '600px',
              textTransform: 'uppercase'
            }}>
              {headingContent && (
                <EditableText
                  enabled={editEnabled}
                  label="Heading"
                  badge="Text"
                  value={headingContent}
                  onSave={(newText) =>
                    inlineEdit?.setText?.('creative_sassy_product_heading', newText)
                  }
                >
                  <h3 style={{
                    margin: '0 0 26px 0',
                    color: '#ffffff',
                    lineHeight: 1.2,
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {headingContent}
                  </h3>
                </EditableText>
              )}

              {subheadings.map((item, index) => (
                <div key={index} style={{
                  marginBottom: index === subheadings.length - 1 ? 0 : '14px'
                }}>
                  <EditableText
                    enabled={editEnabled}
                    label={`Subheading ${index + 1}`}
                    badge="Text"
                    value={item.heading}
                    onSave={(newText) => inlineEdit?.setText?.(item?._edit?.headingKey, newText)}
                  >
                    <h4 style={{
                      margin: '0 0 10px 0',
                      color: '#ffffff',
                      lineHeight: 1.3,
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      {item.heading}
                    </h4>
                  </EditableText>
                  {item.desc && (
                    <EditableText
                      enabled={editEnabled}
                      label={`Subheading ${index + 1} Description`}
                      badge="Text"
                      value={item.desc}
                      onSave={(newText) => inlineEdit?.setText?.(item?._edit?.descKey, newText)}
                    >
                      <h6 style={{
                        margin: 0,
                        color: 'rgba(255, 255, 255, 0.9)',
                        lineHeight: 1.6,
                        fontSize: '14px',
                        fontWeight: 'normal',
                        textTransform: 'none'
                      }}>
                        {item.desc}
                      </h6>
                    </EditableText>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreativeSassyImageWithTextSection;
