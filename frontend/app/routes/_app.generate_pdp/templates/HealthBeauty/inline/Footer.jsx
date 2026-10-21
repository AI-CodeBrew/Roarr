import React from 'react';

/**
 * Footer component for Template1Inline
 */
const Footer = ({ storeName }) => {
  return (
    <footer style={{ backgroundColor: '#ffffff', padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>
            © {new Date().getFullYear()}, {storeName} Powered by Shopify •{' '}
            <span style={{ color: '#374151', textDecoration: 'underline', cursor: 'pointer' }}>
              Privacy policy
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

