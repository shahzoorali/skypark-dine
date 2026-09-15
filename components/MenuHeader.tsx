import Image from 'next/image';
import { flags } from '@/config/flags';
import { BagIcon, PinIcon } from './Icons';

interface Props {
  tableNo?: string;
  cartCount?: number;
  onCartClick?: () => void;
}

export function MenuHeader({ tableNo, cartCount = 0, onCartClick }: Props) {
  return (
    <header className="header">
      <Image
        className="header__logo"
        src="/brand/skypark-logo.png"
        alt="SKYPARK"
        width={120}
        height={28}
        priority
      />

      {flags.tableNumbers && tableNo ? (
        <span className="chip">
          <PinIcon />
          Table {tableNo}
        </span>
      ) : null}

      {flags.ordering ? (
        <button className="iconbtn" onClick={onCartClick} aria-label="View cart">
          <BagIcon />
          {cartCount > 0 && <span className="iconbtn__badge">{cartCount}</span>}
        </button>
      ) : null}
    </header>
  );
}
