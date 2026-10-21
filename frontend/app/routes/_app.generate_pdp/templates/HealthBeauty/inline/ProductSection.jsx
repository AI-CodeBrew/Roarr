import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, UserCircle, Plus, Minus } from 'lucide-react';
import { handleImageError, defaultContent, hexToRgba, darkenColor } from './utils';
import { ShoppingCartIcon, ProcessingIcon, DeliveredIcon, LotusIcon, ShieldWithCheckIcon, SparklesIcon } from './icons';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

/**
 * Product Section component
 */
const ProductSection = ({ content, selectedColor, inlineEdit }) => {
  const productTitle = content.product_title || content.title || 'Product Title';
  const productDesc = content.product_desc || content.description || 'Product description';
  const productImagesMeta = Array.isArray(content?.__meta?.product_images) ? content.__meta.product_images : null;
  const productImages = productImagesMeta
    ? productImagesMeta.map((x) => x.url).filter(Boolean)
    : (Array.isArray(content.images)
      ? content.images
      : (content.images ? Object.values(content.images) : []));
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const thumbnailScrollRef = useRef(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const price = content.price || content.product_price || '$0.00';
  const compareAtPrice = content.compare_at_price || content.comparePrice || '$0.00';
  const orderTracking = content.order_tracking || defaultContent.orderTracking;
  const reviews = content.reviews || defaultContent.reviews;
  const faqs = content.faqs || defaultContent.faqs;
  const editEnabled = !!inlineEdit?.enabled;

  const features = content.features || [
    { icon: LotusIcon, label: 'Natural Radiance' },
    { icon: ShieldWithCheckIcon, label: 'Premium Quality' },
    { icon: SparklesIcon, label: 'Proven Results' }
  ];
  console.log('content', content.reference_images);
  const scrollThumbnails = (direction) => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = 100;
      const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount;
      thumbnailScrollRef.current.scrollBy({
        left: scrollDirection,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{ backgroundColor: hexToRgba(selectedColor, 0.1) }}>
      <style>{`
        .quantity-input::-webkit-outer-spin-button,
        .quantity-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      <div className="px-md-6" style={{ maxWidth: '1280px', margin: '0 auto', padding: '8px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '16px' }}>
          {/* Left Panel - Product Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main Product Image */}
            <div style={{ aspectRatio: '1 / 1', backgroundColor: '#f9fafb', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <EditableImage
                enabled={editEnabled}
                label="Product Image"
                badge="Image"
                src={productImages[selectedImageIndex] || ''}
                alt={productTitle}
                imageKey={productImagesMeta?.[selectedImageIndex]?.key || `product_image_${selectedImageIndex + 1}`}
                pageId={inlineEdit?.pageId || null}
                referenceImages={content.reference_images || []}
                onSave={(newUrl) => {
                  const key = productImagesMeta?.[selectedImageIndex]?.key || `product_image_${selectedImageIndex + 1}`;
                  inlineEdit?.setProductImage?.(key, newUrl);
                }}
              >
                <div style={{ width: '100%', height: '100%' }}>
                  {productImages.length > 0 ? (
                    <img
                      src={productImages[selectedImageIndex]}
                      alt={productTitle}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={handleImageError}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                      <p>No image available</p>
                    </div>
                  )}
                </div>
              </EditableImage>
            </div>

            {/* Thumbnail Carousel */}
            {productImages.length > 1 && (
              <div style={{ position: 'relative' }}>
                {/* Left Arrow */}
                {productImages.length > 4 && (
                  <button
                    onClick={() => scrollThumbnails('left')}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      padding: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                    aria-label="Scroll thumbnails left"
                  >
                    <ChevronLeft style={{ width: '16px', height: '16px', color: '#374151' }} />
                  </button>
                )}

                {/* Thumbnail Container */}
                <div
                  ref={thumbnailScrollRef}
                  className="thumbnail-scroll-container"
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    justifyContent: 'center',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        flexShrink: 0,
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: `2px solid ${selectedImageIndex === index ? '#111827' : '#e5e7eb'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedImageIndex === index ? '0 0 0 2px #d1d5db' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedImageIndex !== index) {
                          e.target.style.borderColor = '#9ca3af';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedImageIndex !== index) {
                          e.target.style.borderColor = '#e5e7eb';
                        }
                      }}
                    >
                      <img
                        src={image}
                        alt={`${productTitle} - View ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>

                {/* Right Arrow */}
                {productImages.length > 4 && (
                  <button
                    onClick={() => scrollThumbnails('right')}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 10,
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      padding: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                    aria-label="Scroll thumbnails right"
                  >
                    <ChevronRight style={{ width: '16px', height: '16px', color: '#374151' }} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Product Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
            {/* Sales Banner */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '8px' }}>
              <div
                style={{
                  backgroundColor: '#ffdb66',
                  color: '#333',
                  padding: '3px 25px',
                  display: 'inline-block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: '1.4',
                  margin: '8px 0',
                  position: 'relative',
                  clipPath: 'polygon(100% 0%, 90% 50%, 100% 100%, 0 100%, 10% 50%, 0 0)'
                }}
              >
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                  FEATURED PRODUCT
                </p>
              </div>
            </div>

            {/* Product Title */}
            <EditableText
              enabled={editEnabled}
              label="Product Title"
              badge="Text"
              value={productTitle}
              onSave={(newText) => inlineEdit?.setText?.(content?.__editKeys?.product_title || 'product_title', newText)}
            >
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
                {productTitle}
              </h1>
            </EditableText>

            {/* Product Description */}
            <EditableText
              enabled={editEnabled}
              label="Product Description"
              badge="Text"
              value={productDesc}
              onSave={(newText) => inlineEdit?.setText?.(content?.__editKeys?.product_desc || 'product_subtitle', newText)}
            >
              <p style={{ color: '#4b5563', fontSize: '12px', lineHeight: '1.625', maxWidth: '448px', margin: '0 auto' }}>
                {productDesc}
              </p>
            </EditableText>

            {/* Feature Icons */}
            <div className="flex flex-wrap gap-4 my-4 w-full justify-center">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex w-1/4 flex-col items-center gap-2">
                    <IconComponent selectedColor={selectedColor} />
                    <span className="flex text-xs text-gray-600 line-clamp-2 text-center" style={{ maxWidth: '80px' }}>
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pricing Section */}
            <div className="flex flex-col gap-4 pb-4">
              <div className="flex items-center gap-4 justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {price}
                </span>
                {compareAtPrice && compareAtPrice !== price && (
                  <span className="text-lg text-gray-500 line-through">
                    {compareAtPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Buy Now Button with Quantity Selector */}
            <div className="flex items-center justify-center gap-3 w-full mx-auto">
              {/* Quantity Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#fff',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={{
                    width: '44px',
                    height: '48px',
                    border: 'none',
                    background: '#f8f8f8',
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    padding: 0,
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e8e8e8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f8f8'}
                  onMouseDown={(e) => e.target.style.backgroundColor = '#d8d8d8'}
                  onMouseUp={(e) => e.target.style.backgroundColor = '#e8e8e8'}
                  aria-label="Decrease quantity"
                >
                  <Minus style={{ width: '18px', height: '18px' }} />
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  value={quantity}
                  min="1"
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, value));
                  }}
                  style={{
                    width: '55px',
                    height: '48px',
                    border: 'none',
                    borderLeft: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    padding: 0,
                    background: '#fff',
                    color: '#333',
                    MozAppearance: 'textfield',
                    boxSizing: 'border-box'
                  }}
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  style={{
                    width: '44px',
                    height: '48px',
                    border: 'none',
                    background: '#f8f8f8',
                    color: '#333',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    padding: 0,
                    lineHeight: 1
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e8e8e8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f8f8'}
                  onMouseDown={(e) => e.target.style.backgroundColor = '#d8d8d8'}
                  onMouseUp={(e) => e.target.style.backgroundColor = '#e8e8e8'}
                  aria-label="Increase quantity"
                >
                  <Plus style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
              {/* Buy Now Button */}
              <button
                className="flex-1 text-white py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 border-none cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                style={{ backgroundColor: selectedColor }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = darkenColor(selectedColor);
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = selectedColor;
                  e.target.style.transform = 'translateY(0)';
                }}
                onMouseDown={(e) => e.target.style.transform = 'translateY(0)'}
                onMouseUp={(e) => e.target.style.transform = 'translateY(-1px)'}
              >
                Buy Now
              </button>
            </div>

            {/* Order Tracking Timeline */}
            <div className="flex flex-wrap gap-4 mt-4 py-1 w-full justify-center">
              <div className="flex w-full items-center gap-4 justify-center">
                {orderTracking.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex w-1/4 flex-col items-center gap-2">
                      {step.icon === 'shopping-cart' && <ShoppingCartIcon selectedColor={selectedColor} />}
                      {step.icon === 'processing' && <ProcessingIcon selectedColor={selectedColor} />}
                      {step.icon === 'delivered' && <DeliveredIcon selectedColor={selectedColor} />}
                      <div className="text-center">
                        <p className="text-xs font-medium text-gray-900">{step.status}</p>
                        <p className="text-xs text-gray-600">{step.date}</p>
                      </div>
                    </div>
                    {index < orderTracking.length - 1 && (
                      <div className="hidden w-12 h-0.5 bg-gray-300"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>


            {/* FAQ Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '16px 0' }}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  style={{ borderBottom: index < faqs.length - 1 ? '1px solid #e5e7eb' : 'none' }}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #000000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    </div>
                    <EditableText
                      enabled={editEnabled}
                      label="FAQ Question"
                      badge="Text"
                      value={faq.question}
                      onSave={(newText) => {
                        const k = faq?._edit?.questionKey || `product_question_${index + 1}`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <span style={{ flex: 1, fontSize: '12px', color: '#111827', fontWeight: '500' }}>
                        {faq.question}
                      </span>
                    </EditableText>
                    <Plus
                      style={{
                        width: '20px',
                        height: '20px',
                        flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: expandedFaq === index ? 'rotate(45deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {expandedFaq === index && (
                    <EditableText
                      enabled={editEnabled}
                      label="FAQ Answer"
                      badge="Text"
                      value={faq.answer || ''}
                      onSave={(newText) => {
                        const k = faq?._edit?.answerKey || `product_question_${index + 1}_answer`;
                        inlineEdit?.setText?.(k, newText);
                      }}
                    >
                      <div style={{ padding: '0 12px 12px 12px', fontSize: '12px', color: '#4b5563', textAlign: 'left' }}>
                        {faq.answer}
                      </div>
                    </EditableText>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSection;

