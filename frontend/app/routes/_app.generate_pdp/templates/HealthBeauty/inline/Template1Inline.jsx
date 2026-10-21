import React from 'react';
import { darkenColor } from './utils';
import { globalStyles } from './styles';
import Header from './Header';
import Footer from './Footer';
import ProductSection from './ProductSection';
import MarqueeSection from './MarqueeSection';
import HeadingSubheadingSection from './HeadingSubheadingSection';
import LovedByEveryoneSection from './LovedByEveryoneSection';
import BeforeAfterSection from './BeforeAfterSection';
import ImageWithTextSection from './ImageWithTextSection';
import CreativeSassyImageWithTextSection from './CreativeSassyImageWithTextSection';
import CircularFeatureRingSection from './CircularFeatureRingSection';
import IngredientsSection from './IngredientsSection';
import ImpactStatsSection from './ImpactStatsSection';
import ComparisonTableSection from './ComparisonTableSection';
import RealReviewsSection from './RealReviewsSection';
import FAQSection from './FAQSection';

/**
 * HealthBeauty Template 1 Component - Inline Styles Version
 * 
 * This component renders the health-beauty template 1 design using inline styles instead of Tailwind CSS.
 * The component is modularized into separate section files for better maintainability.
 * 
 * @param {Object} props
 * @param {Object} props.content - The content object containing all template data
 * @param {string} props.content.product_title - Product title
 * @param {string} props.content.product_desc - Product description
 * @param {Object} props.content.images - Image URLs object
 * @param {string} props.content.storeName - Store name for header
 * @param {string} props.selectedColor - Primary color for the template
 * @param {string} props.selectedFontFamily - Font family to use
 * @param {string} props.className - Additional CSS classes
 */
const Template1Inline = ({ content = {}, className = '', selectedColor = '#A34E4E', selectedFontFamily }) => {
  const storeName = content.storeName || content.store_name || 'horizon-asd';
  const darkenColorFn = (color) => darkenColor(color);
  const inlineEdit = content?.inlineEdit || null;
  const sectionStyle = { scrollMarginTop: 88 };

  return (
    <div
      style={{
        fontFamily: selectedFontFamily || 'Poppins, sans-serif',
        ...(className ? {} : {})
      }}
    >
      <style>{globalStyles}</style>

      <div data-section-id="header" style={sectionStyle}>
        <Header storeName={storeName} selectedFontFamily={selectedFontFamily} />
      </div>

      <div data-section-id="product" style={sectionStyle}>
        <ProductSection
          content={content}
          selectedColor={selectedColor}
          darkenColor={darkenColorFn}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="marquee" style={sectionStyle}>
        <MarqueeSection
          content={content}
          selectedColor={selectedColor}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="heading-subheading" style={sectionStyle}>
        <HeadingSubheadingSection
          content={content}
          selectedColor={selectedColor}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="loved-by" style={sectionStyle}>
        <LovedByEveryoneSection content={content} inlineEdit={inlineEdit} />
      </div>


      <div data-section-id="before-after" style={sectionStyle}>
        <BeforeAfterSection
          content={content}
          selectedColor={selectedColor}
          darkenColor={darkenColorFn}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="creative-sassy" style={sectionStyle}>
        <CreativeSassyImageWithTextSection
          content={content}
          selectedColor={selectedColor}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="circular-features" style={sectionStyle}>
        <CircularFeatureRingSection
          content={content}
          selectedColor={selectedColor}
          inlineEdit={inlineEdit}
        />
      </div>

      {/* <ImageWithTextSection
        content={content}
        selectedColor={selectedColor}
        darkenColor={darkenColorFn}
      /> */}

      <div data-section-id="ingredients" style={sectionStyle}>
        <IngredientsSection content={content} selectedColor={selectedColor} inlineEdit={inlineEdit} />
      </div>

      <div data-section-id="impact-stats" style={sectionStyle}>
        <ImpactStatsSection
          content={content}
          selectedColor={selectedColor}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="comparison" style={sectionStyle}>
        <ComparisonTableSection content={content} selectedColor={selectedColor} inlineEdit={inlineEdit} />
      </div>

      {/* <RealReviewsSection
        content={content}
        selectedColor={selectedColor}
      /> */}

      <div data-section-id="faq" style={sectionStyle}>
        <FAQSection
          content={content}
          selectedColor={selectedColor}
          inlineEdit={inlineEdit}
        />
      </div>

      <div data-section-id="footer" style={sectionStyle}>
        <Footer storeName={storeName} />
      </div>
    </div>
  );
};

export default Template1Inline;

