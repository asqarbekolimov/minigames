import './not-found-page.scss';

export function createNotFoundPage(): HTMLElement {
  const main = document.createElement('main');

  main.classList.add('not-found');
  main.innerHTML = `
    <section class="not-found__section">
      <div class="container not-found__container">
        <p class="not-found__code" aria-hidden="true">404</p>
        <h1 class="not-found__title">Page Not Found</h1>
        <p class="not-found__text">
          Sorry, the page <span class="not-found__path"></span> does not exist or may have been
          moved.
        </p>
        <a class="not-found__button" href="/" data-route="home">Return to Home Page</a>
      </div>
    </section>
  `;

  const path = main.querySelector<HTMLElement>('.not-found__path');
  if (path) path.textContent = globalThis.location.pathname;

  return main;
}
