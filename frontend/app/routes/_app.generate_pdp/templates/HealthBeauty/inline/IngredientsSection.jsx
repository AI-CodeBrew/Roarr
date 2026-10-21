import React, { useState } from 'react';
import { handleImageError, defaultContent, hexToRgba } from './utils';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

/**
 * Ingredients Section (Four Blocks) component
 */
const IngredientsSection = ({ content, selectedColor = '#B86A14', inlineEdit }) => {
  const [fourBlocksIndex, setFourBlocksIndex] = useState(0);
  const defaultIngredientsHeading = defaultContent.ingredientsHeading;
  const defaultIngredientsSubheading = defaultContent.ingredientsSubheading;
  const ingredients = content.ingredients || defaultContent.ingredients;
  const editEnabled = !!inlineEdit?.enabled;
  const headingKey = content?.__editKeys?.ingredients_heading || 'four_blocks_heading';
  const subheadingKey = content?.__editKeys?.ingredients_subheading || 'four_blocks_subheading';

  return (
    <div className="px-6 py-4" style={{ backgroundColor: hexToRgba(selectedColor, 0.1) }}>
      <div className="max-w-[1280px] mx-auto">
        <EditableText
          enabled={editEnabled}
          label="Ingredients Heading"
          badge="Text"
          value={content.ingredients_heading || defaultIngredientsHeading}
          onSave={(newText) => inlineEdit?.setText?.(headingKey, newText)}
        >
          <h2 className="text-xl font-bold text-center mb-4" style={{ color: selectedColor }}>
            {content.ingredients_heading || defaultIngredientsHeading}
          </h2>
        </EditableText>

        <EditableText
          enabled={editEnabled}
          label="Ingredients Subheading"
          badge="Text"
          value={content.ingredients_subheading || defaultIngredientsSubheading}
          onSave={(newText) => inlineEdit?.setText?.(subheadingKey, newText)}
        >
          <p className="text-xs text-gray-700 text-center mb-12 max-w-[768px] mx-auto">
            {content.ingredients_subheading || defaultIngredientsSubheading}
          </p>
        </EditableText>

        <div className="relative w-full overflow-hidden">
          <div className="overflow-hidden rounded-lg">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${fourBlocksIndex * (100 / ingredients.length)}%)`,
                width: `${ingredients.length * 100}%`
              }}
            >
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex-shrink-0 px-2 box-border" style={{ width: `${100 / ingredients.length}%` }}>
                  <div className="flex flex-col items-center text-center gap-4 p-4 rounded-lg shadow-sm bg-white w-full box-border" style={{ border: `1px solid ${selectedColor}` }}>
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 flex-shrink-0">
                      <EditableImage
                        enabled={editEnabled}
                        label={`Ingredient ${index + 1} Image`}
                        badge="Image"
                        src={ingredient.image}
                        alt={ingredient.title}
                        imageKey={ingredient?._edit?.imageKey || `product_highlight_${index + 1}`}
                        pageId={inlineEdit?.pageId || null}
                        referenceImages={content.reference_images || []}
                        onSave={(newUrl) => {
                          const k = ingredient?._edit?.imageKey || `product_highlight_${index + 1}`;
                          inlineEdit?.setBodyImage?.(k, newUrl);
                        }}
                      >
                        <div className="w-full h-full">
                          <img
                            src={ingredient.image}
                            alt={ingredient.title}
                            className="w-full h-full object-cover block"
                            onError={handleImageError}
                          />
                        </div>
                      </EditableImage>
                    </div>
                    <div className="flex flex-col gap-2">
                      <EditableText
                        enabled={editEnabled}
                        label={`Ingredient ${index + 1} Title`}
                        badge="Text"
                        value={ingredient.title}
                        onSave={(newText) => {
                          const k = ingredient?._edit?.titleKey || `four_blocks_block_${index + 1}_name`;
                          inlineEdit?.setText?.(k, newText);
                        }}
                      >
                        <h3 className="text-lg font-extrabold text-black m-0">
                          {ingredient.title}
                        </h3>
                      </EditableText>

                      <EditableText
                        enabled={editEnabled}
                        label={`Ingredient ${index + 1} Description`}
                        badge="Text"
                        value={ingredient.description}
                        onSave={(newText) => {
                          const k = ingredient?._edit?.descKey || `four_blocks_block_${index + 1}_desc`;
                          inlineEdit?.setText?.(k, newText);
                        }}
                      >
                        <p className="text-xs text-gray-700 leading-relaxed m-0">
                          {ingredient.description}
                        </p>
                      </EditableText>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ingredients.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 mb-2">
              {ingredients.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFourBlocksIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 border-none cursor-pointer ${index === fourBlocksIndex ? 'bg-black' : 'bg-gray-300'
                    }`}
                  aria-label={`Go to block ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IngredientsSection;

