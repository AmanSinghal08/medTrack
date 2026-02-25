const formatCurrency = (val: number): string => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export {formatCurrency}