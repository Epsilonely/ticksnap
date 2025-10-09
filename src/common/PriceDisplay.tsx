interface PriceDisplayProps {
  price: number;
  className?: string;
  decimalPlaces: number;
}

function PriceDisplay({ price, className = 'text-[#4C4C57]', decimalPlaces = 2 }: PriceDisplayProps) {
  const formattedPrice = price
    .toFixed(decimalPlaces)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
  const [integerPart, decimalPart] = formattedPrice.split('.');
  const hasDecimal = decimalPart !== undefined;

  return (
    <span className={`${className}`}>
      <span>{Number(integerPart).toLocaleString()}</span>
      {hasDecimal && <span className="opacity-70 text-[0.96em]">.{decimalPart}</span>}
    </span>
  );
}

export default PriceDisplay;
