import type { GameCardI } from '@/utils/type';
import './game-cards.scss';

const fetchCards = async () => {
  const response = await fetch('/assets/mock-data/all-games-seed.json');

  if (!response.ok) {
    throw new Error(`Failed to fetch games: ${response.status}`);
  }

  const { data } = await response.json();
  return data;
};
const cardsInfo: GameCardI[] = await fetchCards();

export function createGameCards(): HTMLElement {
  const cardsContainer = document.createElement('div');

  cardsContainer.classList.add('cards');

  cardsContainer.append(cardsItem(cardsInfo));

  return cardsContainer;
}

function cardsItem(gameItems: GameCardI[]): HTMLElement {
  const container = document.createElement('div');

  container.classList.add('cards__container');

  for (const gameItem of gameItems.slice(0, 6)) {
    const card = document.createElement('div');
    const priceClass = /^\$?\d+(?:\.\d+)?$/.test(String(gameItem.price).trim())
      ? 'number'
      : 'string';

    card.classList.add('card__item');

    card.innerHTML = `
      <div class="card__item-img">
        <img src=${gameItem.cardImage} alt=${gameItem.name}/>
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
                <span>${gameItem.rating}K</span>
              </div>
            </div>
            <div class="game__price ${priceClass}">${gameItem.price}</div>
          </div>
          <button class="detail-buttton">Details</button>
        </div>
      </div>

    `;

    container.append(card);
  }

  return container;
}
