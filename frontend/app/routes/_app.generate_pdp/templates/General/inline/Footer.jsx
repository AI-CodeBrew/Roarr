import React from 'react';

/**
 * Footer component
 */
const Footer = ({ storeName }) => {
  return (
    <footer className="bg-white px-4 py-2 border-t border-gray-200">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()}, {storeName} Powered by Shopify •{' '}
            <span className="text-gray-700 underline cursor-pointer">
              Privacy policy
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

