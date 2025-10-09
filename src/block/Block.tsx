import MarketBlock from './MarketBlock';
import CoinDetailBlock from './CoinDetailBlock';
import Portfolio from '../components/Portfolio';

enum BlockType {
  BLOCK_TY_MARKET,
  BLOCK_TY_ALARM,
  BLOCK_TY_ALARM_HISTORY,
  BLOCK_TY_COIN_DETAIL,
  BLOCK_TY_PORTFOLIO,
  BLOCK_TY_LEADERBOARD,
}

type BlockProps = {
  type?: BlockType;
};

function Block({ type }: BlockProps) {
  let content;

  switch (type) {
    case BlockType.BLOCK_TY_MARKET:
      content = <MarketBlock />;
      break;
    case BlockType.BLOCK_TY_COIN_DETAIL:
      content = <CoinDetailBlock />;
      break;
    case BlockType.BLOCK_TY_PORTFOLIO:
      content = <Portfolio />;
      break;
    default:
      content = <div>기본</div>;
  }
  return <div className="h-full overflow-hidden bg-green-400">{content}</div>;
}

export { BlockType };
export default Block;
