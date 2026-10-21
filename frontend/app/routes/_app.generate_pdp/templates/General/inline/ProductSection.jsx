import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, UserCircle, Plus, Minus } from 'lucide-react';
import { handleImageError, defaultContent, hexToRgba, darkenColor } from './utils';
import { ShoppingCartIcon, ProcessingIcon, DeliveredIcon, LotusIcon, ShieldWithCheckIcon, SparklesIcon, LightningIcon } from './icons';
import EditableText from '../../HealthBeauty/inline/EditableText';
import EditableImage from '../../HealthBeauty/inline/EditableImage';

/**
 * Product Section component
 */
const ProductSection = ({ content, selectedColor, inlineEdit }) => {
  const productTitle = content.product_title || content.title || 'Product Title';
  const productDesc = content.product_desc || content.description || 'Product description';
  const editEnabled = !!inlineEdit?.enabled;
  const productImagesMeta = Array.isArray(content?.__meta?.product_images) ? content.__meta.product_images : null;
  const productImages = productImagesMeta
    ? productImagesMeta.map((x) => x.url).filter(Boolean)
    : (Array.isArray(content.images) ? content.images : (content.images ? Object.values(content.images) : []));
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

  const features = content.features || [
    { icon: LightningIcon, label: 'Easy to use' },
    { icon: ShieldWithCheckIcon, label: 'Safe & Durable' },
    { icon: SparklesIcon, label: 'Premium' }
  ];

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
      <div className="px-md-6 max-w-[1280px] mx-auto p-2">
        <div className="grid grid-cols-1 gap-4">
          {/* Left Panel - Product Images */}
          <div className="flex flex-col gap-4">
            {/* Main Product Image */}
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
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
                  const k = productImagesMeta?.[selectedImageIndex]?.key || `product_image_${selectedImageIndex + 1}`;
                  inlineEdit?.setProductImage?.(k, newUrl);
                }}
              >
                <div className="w-full h-full">
                  {productImages.length > 0 ? (
                    <img
                      src={productImages[selectedImageIndex]}
                      alt={productTitle}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <p>No image available</p>
                    </div>
                  )}
                </div>
              </EditableImage>
            </div>

            {/* Thumbnail Carousel */}
            {productImages.length > 1 && (
              <div className="relative">
                {/* Left Arrow */}
                {productImages.length > 4 && (
                  <button
                    onClick={() => scrollThumbnails('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-md border border-gray-200 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
                    aria-label="Scroll thumbnails left"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                )}

                {/* Thumbnail Container */}
                <div
                  ref={thumbnailScrollRef}
                  className="thumbnail-scroll-container flex gap-2 overflow-x-auto pb-2 justify-center [scrollbar-width:none] [-ms-overflow-style:none]"
                >
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${selectedImageIndex === index ? 'shadow-[0_0_0_2px_#d1d5db]' : ''
                        }`}
                      style={{
                        border: `2px solid ${selectedImageIndex === index ? '#111827' : '#e5e7eb'}`
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
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>

                {/* Right Arrow */}
                {productImages.length > 4 && (
                  <button
                    onClick={() => scrollThumbnails('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-1.5 shadow-md border border-gray-200 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
                    aria-label="Scroll thumbnails right"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Product Details */}
          <div className="flex flex-col gap-2 text-center">
            {/* Sales Banner */}
            <div className="flex justify-center w-full mb-2">
              <div
                className="inline-flex items-center justify-center relative"
                style={{
                  backgroundColor: '#ffdb66',
                  color: '#333',
                  padding: '3px 25px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: '1.4',
                  margin: '8px 0',
                  clipPath: 'polygon(100% 0%, 90% 50%, 100% 100%, 0 100%, 10% 50%, 0 0)'
                }}
              >
                <p className="m-0" style={{ color: '#333', margin: 0 }}>
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
              <h1 className="text-xl font-bold text-gray-900">
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
              <p className="text-gray-600 text-xs leading-relaxed max-w-[448px] mx-auto">
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
            <div className="flex flex-col gap-0 py-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={index < faqs.length - 1 ? 'border-b border-gray-200' : ''}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center gap-3 p-3 text-left bg-transparent border-none cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded border border-black flex items-center justify-center flex-shrink-0">
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
                      <span className="flex-1 text-xs text-gray-900 font-medium">
                        {faq.question}
                      </span>
                    </EditableText>
                    <Plus
                      className="w-5 h-5 text-black flex-shrink-0 transition-transform duration-200"
                      style={{
                        transform: expandedFaq === index ? 'rotate(45deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {expandedFaq === index && faq.answer && (
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
                      <div className="px-3 pb-3 text-xs text-gray-600 text-left">
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

