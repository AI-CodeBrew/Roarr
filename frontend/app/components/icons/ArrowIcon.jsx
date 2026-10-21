export default function ArrowIcon({ size = 16, rotation = 0, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={{ 
        transform: `rotate(${rotation}deg)`,
        display: 'block',
        transition: 'transform 0.2s ease'
      }}
      {...props}
    >
      <g>
        <path
          d="M27.2,24,16.6,34.6a1.9,1.9,0,0,0,.2,3,2.1,2.1,0,0,0,2.7-.2l11.9-12a1.9,1.9,0,0,0,0-2.8l-11.9-12a2.1,2.1,0,0,0-2.7-.2,1.9,1.9,0,0,0-.2,3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
