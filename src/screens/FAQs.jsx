import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQs() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqsData = [
    {
      question: "How to approve crop batches?",
      answer: "Go to the QA Dashboard, review the pending batch records in the \"Pending Quality Audit Queue\" card and click \"Approve Record Pass\" to approve them. Alternatively, open the detailed crop passport view of any batch and click the \"Approve Batch\" button in the admin control card."
    },
    {
      question: "How to generate QR codes?",
      answer: "Open the crop batch details page (Product Passport). Once the batch status is updated to approved (\"QA Approved\" or \"Shipped\"), click the active \"Generate QR\" button in the admin control panel. The system will automatically create and link the QR traceability passport URL in the database."
    },
    {
      question: "How to verify reports?",
      answer: "Select \"General Reports\" from the sidebar navigation. This lists all laboratory, compliance, or soil testing reports. You can upload new reports, delete outdated ones, or click \"View\" to open an interactive preview supporting images, PDFs, and tabular CSV rendering."
    },
    {
      question: "How to track crop lifecycle?",
      answer: "Locate the crop batch in the \"Batch Monitoring Registry\" table on the QA Dashboard and click the \"View History Logs\" (clock icon) button. This opens the complete chronological timeline of events like planting, watering, fertilizing, and harvesting."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 bg-warmSand dark:bg-[#0c140f] transition-colors duration-300">
      <div className="border-b border-stone-200/40 dark:border-emerald-950/20 pb-6">
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
          <HelpCircle className="h-7.5 w-7.5 text-primary" />
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          Find quick help and walkthrough guidelines for common administrative tasks.
        </p>
      </div>

      <div className="space-y-4">
        {faqsData.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div 
              key={index} 
              className="bg-white dark:bg-[#121f17] border border-borders dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-5 text-left font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors focus:outline-none"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="h-4.5 w-4.5 text-primary shrink-0" />
                ) : (
                  <ChevronDown className="h-4.5 w-4.5 text-stone-400 shrink-0" />
                )}
              </button>

              {/* Accordion Content */}
              {isOpen && (
                <div className="p-5 pt-0 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/10 font-sans">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
