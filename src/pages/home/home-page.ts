import { createHeroSection } from '@/components/home-page/hero';
import './home-page.scss';

export function createHomePage(): HTMLElement {
  const homePage = document.createElement('main');

  homePage.append(createHeroSection());

  return homePage;
}
