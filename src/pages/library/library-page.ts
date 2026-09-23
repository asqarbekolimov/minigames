export function createLibraryPage(): HTMLElement {
  const page = document.createElement('main');
  page.classList.add('page-placeholder');

  page.innerHTML = `
  <div>
    <h1>Library</h1>
  </div>
  `;

  return page;
}
