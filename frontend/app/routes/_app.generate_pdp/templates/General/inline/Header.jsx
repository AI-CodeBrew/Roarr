import React from 'react';

/**
 * Header component for Template1Inline
 */
const Header = ({ storeName, selectedFontFamily }) => {
  return (
    <>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0">
        <div className="header-height-md max-w-full mx-auto flex items-center justify-center h-10 text-black" style={{ fontFamily: selectedFontFamily || 'Poppins, sans-serif' }}>
          {storeName}
        </div>
      </header>
    </>
  );
};

export default Header;

