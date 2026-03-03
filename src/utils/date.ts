const formatDate = (isoString: string ): string => {
  const date = new Date(isoString);

  // Check for invalid date strings
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = String(date.getFullYear()).slice(-2); // Get last two digits

  return `${day}-${month}-${year}`;
};

const getSixMonthsFromNow = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);

  return d.toISOString().split('T')[0];
};

export { formatDate, getSixMonthsFromNow };
