export default function LogoSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${sizes[size]}`}>
        <img
          src="/favicon_icon.png"
          alt="Loading"
          className="w-full h-full rounded-full object-cover animate-pulse ring-2 ring-forest-200"
        />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-forest-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-earth-500 animate-pulse">
        Loading Nivaran...
      </p>
    </div>
  );
}
