import { createHeroSection } from '@/components/home-page/hero';
import './home-page.scss';
import { createSliderSection } from '@/components/home-page/slider';
import { createTopPlayers } from '@/components/home-page/top-player';
import { createCtaSection } from '@/components/home-page/cta';

export function createHomePage(): HTMLElement {
  const homePage = document.createElement('main');

  homePage.append(
    createHeroSection(),
    createSliderSection(),
    createTopPlayers(),
    createCtaSection(),
  );

  return homePage;
}
