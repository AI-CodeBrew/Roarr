import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { defaultContent } from './utils';
import EditableText from '../../HealthBeauty/inline/EditableText';

/**
 * FAQ Section component
 */
const FAQSection = ({ content, selectedColor, inlineEdit }) => {
  const [expandedMainFaq, setExpandedMainFaq] = useState(0);
  const mainFaqs = content.main_faqs || defaultContent.faqs;
  const editEnabled = !!inlineEdit?.enabled;

  return (
    <div className="bg-white p-4">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-2">GOT QUESTIONS?</p>
          <h2 className="text-xl font-bold">
            <span className="text-black">We've Got </span>
            <span style={{ color: selectedColor }}>Answers</span>
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {mainFaqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: selectedColor }}
            >
              <button
                onClick={() => setExpandedMainFaq(expandedMainFaq === index ? null : index)}
                className="w-full flex items-center justify-between py-2 px-4 text-left bg-transparent border-none cursor-pointer"
              >
                <EditableText
                  enabled={editEnabled}
                  label="FAQ Question"
                  badge="Text"
                  value={faq.question}
                  onSave={(newText) => {
                    const k = faq?._edit?.questionKey || `faq_question_${index + 1}`;
                    inlineEdit?.setText?.(k, newText);
                  }}
                >
                  <span className="text-white text-base font-extrabold pr-4">
                    {faq.question}
                  </span>
                </EditableText>
                {expandedMainFaq === index ? (
                  <X className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2} />
                ) : (
                  <Plus className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2} />
                )}
              </button>
              {expandedMainFaq === index && faq.answer && (
                <EditableText
                  enabled={editEnabled}
                  label="FAQ Answer"
                  badge="Text"
                  value={faq.answer || ''}
                  onSave={(newText) => {
                    const k = faq?._edit?.answerKey || `faq_answer_${index + 1}`;
                    inlineEdit?.setText?.(k, newText);
                  }}
                >
                  <div className="px-2 pb-2 pl-4 text-white text-xs leading-relaxed">
                    {faq.answer}
                  </div>
                </EditableText>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;

