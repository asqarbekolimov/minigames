import { createHeader } from '@/components/header/header';
import { createFooter } from '@/components/footer/footer';

export function createAppLayout(content: HTMLElement): HTMLElement {
  const layout = document.createElement('div');
  layout.classList.add('wrapper');

  layout.append(createHeader(), content, createFooter());

  return layout;
}
