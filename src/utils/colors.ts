const getBrandColorStyles = (brandName: string = 'Generic') => {
  const colorSchemes = [
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  ];
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = brandName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorSchemes[Math.abs(hash) % colorSchemes.length];
};

export {
    getBrandColorStyles
}