import type { GameCardI } from '@/utils/type';
import './game-cards.scss';

function formatLikes(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getPriceClass(price: string | number): 'number' | 'string' {
  return /^\$?\d+(?:\.\d+)?$/.test(String(price).trim()) ? 'number' : 'string';
}

function createCard(gameItem: GameCardI): HTMLElement {
  const card = document.createElement('div');
  const priceClass = getPriceClass(gameItem.price);

  card.classList.add('card__item');

  card.innerHTML = `
    <div class="card__item-img">
      <img src="${gameItem.cardImage}" alt="${gameItem.name}" loading="lazy" decoding="async"/>
    </div>
    <div class="card__item-info">
      <div class="card__item-header">
        <div class="card__item-header-title">
          <h2 class="game__name">${gameItem.name}</h2>
          <span class="game__category">${gameItem.category}</span>
        </div>

        <div class="game__price ${priceClass}">${gameItem.price}</div>
      </div>

      <p class="card__item-body">${gameItem.shortDescription}</p>

      <div class="card__item-footer">
        <div class='card__item-footer-ratings'>
          <div class="ratings__count">
            <div class="ratings__item">
              <img src='/assets/icons/star.svg' alt='star'/>
              <span>${gameItem.rating}</span>
            </div>
            <div class="ratings__item">
              <img src='/assets/icons/favorite.svg' alt='like'/>
              <span>${formatLikes(gameItem.likesCount)}</span>
            </div>
          </div>
          <div class="game__price ${priceClass}">${gameItem.price}</div>
        </div>
        <button class="detail-button" type="button" data-open-game-details>Details</button>
      </div>
    </div>
  `;

  return card;
}

export function createGameCards(gameItems: GameCardI[]): HTMLElement {
  const cardsContainer = document.createElement('div');
  const container = document.createElement('div');

  cardsContainer.classList.add('cards');
  container.classList.add('cards__container');

  for (const gameItem of gameItems) {
    container.append(createCard(gameItem));
  }

  cardsContainer.append(container);

  return cardsContainer;
}
