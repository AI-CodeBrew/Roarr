import React from 'react';

/**
 * Header component for Template1Inline
 */
const Header = ({ storeName, selectedFontFamily }) => {
  return (
    <>

      {/* Main Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0 }}>
        <div className="header-height-md" style={{ maxWidth: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', color: '#000000', fontFamily: selectedFontFamily || 'Poppins, sans-serif' }}>
          {storeName}
        </div>
      </header>
    </>
  );
};

export default Header;

