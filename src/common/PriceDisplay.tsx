interface PriceDisplayProps {
  price: number;
  className?: string;
  decimalPlaces: number;
}

function PriceDisplay({ price, className = 'text-[#4C4C57]', decimalPlaces = 2 }: PriceDisplayProps) {
  const [integerPart, decimalPart] = price.toFixed(decimalPlaces).split('.');
  const hasDecimal = parseFloat(`0.${decimalPart}`) > 0;

  return (
    <span className={`${className}`}>
      <span>{Number(integerPart).toLocaleString()}</span>
      {hasDecimal && <span className="opacity-60">.{decimalPart}</span>}
    </span>
  );
}

export default PriceDisplay;
