import BrelshazaBanner from "../banners/brelshaza.jpg";
import CaliligosBanner from "../banners/caliligos.jpg";
import HanumatanBanner from "../banners/hanumatan.png";
import KakulBanner from "../banners/kakul.jpg";
import ValtanBanner from "../banners/valtan.jpg";
import VykasBanner from "../banners/vykas.jpg";

import BrelshazaIcon from "../icons/brelshaza.png";
import CaliligosIcon from "../icons/caliligos.jpg";
import HanumatanIcon from "../icons/hanumatan.png";
import KakulIcon from "../icons/kakul-saydon.jpg";
import ValtanIcon from "../icons/valtan.jpg";
import VykasIcon from "../icons/vykas.jpg";

import AppIcon from "../appicon.png";

export function getAppIcon(): string {
	return AppIcon;
}

export const RAID_ICONS: Record<string, string> = {
	"Kakul-Saydon": KakulIcon,
	Brelshaza: BrelshazaIcon,
	Caliligos: CaliligosIcon,
	Vykas: VykasIcon,
	Valtan: ValtanIcon,
	Hanumatan: HanumatanIcon,
};


export const RAID_BANNERS: Record<string, string> = {
	"Kakul-Saydon": KakulBanner,
	Brelshaza: BrelshazaBanner,
	Caliligos: CaliligosBanner,
	Vykas: VykasBanner,
	Valtan: ValtanBanner,
	Hanumatan: HanumatanBanner,
};