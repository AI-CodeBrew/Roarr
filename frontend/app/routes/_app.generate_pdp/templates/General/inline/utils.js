/**
 * Utility functions for Template1Inline
 */

/**
 * Darkens a color by reducing RGB values
 * @param {string} color - Hex color string (e.g., '#B86A14')
 * @returns {string} Darkened hex color string
 */
export const darkenColor = (color) => {
  const hex = color.replace('#', '');
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Converts hex color to rgba with specified opacity
 * @param {string} color - Hex color string (e.g., '#B86A14')
 * @param {number} opacity - Opacity value between 0 and 1 (e.g., 0.1 for 10%)
 * @returns {string} RGBA color string
 */
export const hexToRgba = (color, opacity = 1) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Handles image error by replacing with SVG fallback
 * @param {Event} e - Error event
 */
export const handleImageError = (e) => {
  e.target.style.display = 'none';
  const parent = e.target.parentElement;
  if (parent && !parent.querySelector('.image-fallback-svg')) {
    const fallback = document.createElement('div');
    fallback.className = 'image-fallback-svg w-full h-full flex items-center justify-center bg-gray-50';
    fallback.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path stroke="#d3d3d3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 16 5-7 6 6.5m6.5 2.5L16 13l-4.286 6M14 10h.01M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/></svg>';
    parent.appendChild(fallback);
  }
};

/**
 * Default content values
 */
export const defaultContent = {
  heading: 'Lorem Ipsum',
  subheading: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  beforeText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  afterText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  imageTextHeading: 'Lorem Ipsum',
  imageTextDescription: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  ingredientsHeading: 'Lorem ipsum dolor',
  ingredientsSubheading: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  comparisonSubheading: 'Lorem ipsum dolor. Lorem ipsum dolor',
  impactStatsHeading: 'Lorem Ipsum',
  orderTracking: [
    { status: 'Order placed', date: 'Date', icon: 'shopping-cart' },
    { status: 'Processing', date: 'Date', icon: 'processing' },
    { status: 'Delivered', date: 'Date', icon: 'delivered' }
  ],
  reviews: [
    { name: 'Name 1', rating: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { name: 'Name 2', rating: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { name: 'Name 3', rating: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
  ],
  faqs: [
    { question: 'Question 1: Lorem Ipsum', answer: 'Answer 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { question: 'Question 2: Lorem Ipsum', answer: 'Answer 2: Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { question: 'Question 3: Lorem Ipsum', answer: 'Answer 3: Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { question: 'Question 4: Lorem Ipsum', answer: 'Answer 4: Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { question: 'Question 5: Lorem Ipsum', answer: 'Answer 5: Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
  ],
  realReviews: [
    { image: '', rating: 5, title: 'Title 1', comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', name: 'Name 1' },
    { image: '', rating: 5, title: 'Title 2', comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', name: 'Name 2' },
    { image: '', rating: 5, title: 'Title 3', comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', name: 'Name 3' }
  ],
  ingredients: [
    { image: '', title: 'Title 1', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { image: '', title: 'Title 2', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { image: '', title: 'Title 3', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { image: '', title: 'Title 4', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
  ],
  impactStats: [
    { percentage: 95, title: 'Title 1', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { percentage: 92, title: 'Title 2', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { percentage: 88, title: 'Title 3', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' }
  ],
  comparisonFeatures: [
    { feature: 'Feature 1', us: true, others: false },
    { feature: 'Feature 2', us: true, others: false },
    { feature: 'Feature 3', us: true, others: false }
  ]
};

