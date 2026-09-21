import './header.scss';
import logoPath from '@/assets/icons/logo.svg';

const navLinks = [
  { path: '#', name: 'Home' },
  { path: '#', name: 'Library' },
  { path: '#', name: 'Tournaments' },
  { path: '#', name: 'Community' },
];

export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.classList.add('header');

  const logo = document.createElement('a');
  logo.classList.add('header__logo');
  logo.href = '#';

  const logoImg = document.createElement('img');
  logoImg.classList.add('header__logo-image');
  logoImg.src = logoPath;
  logoImg.alt = 'Logo';

  const logoName = document.createElement('div');
  logoName.classList.add('header__logo-name');
  logoName.textContent = 'MiniGames';

  logo.append(logoImg, logoName);

  const nav = document.createElement('div');
  nav.classList.add('header__nav');

  const navbar = document.createElement('ul');
  navbar.classList.add('header__navbar');

  const navItems = navLinks.map((link) => {
    const navbarItem = document.createElement('li');
    navbarItem.classList.add('nav__item');

    const navLink = document.createElement('a');
    navLink.href = link.path;
    navLink.textContent = link.name;

    if (link.name === 'Home') {
      navbarItem.classList.add('active');
    }

    navbarItem.append(navLink);
    return navbarItem;
  });

  navbar.append(...navItems);

  const actions = document.createElement('div');
  actions.classList.add('header__nav-buttons');

  const signInButton = document.createElement('button');
  signInButton.classList.add('button', 'signin__button');
  signInButton.textContent = 'Log In';
  signInButton.addEventListener('click', () => {
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
  });

  const signUpButton = document.createElement('button');
  signUpButton.classList.add('button', 'signup__button');
  signUpButton.textContent = 'Sign Up';
  signUpButton.addEventListener('click', () => {
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
  });

  const menuButton = document.createElement('button');
  menuButton.classList.add('button', 'menu__button');
  menuButton.type = 'button';
  menuButton.setAttribute('aria-label', 'Open menu');

  const menuLine1 = document.createElement('span');
  const menuLine2 = document.createElement('span');
  const menuLine3 = document.createElement('span');
  menuButton.append(menuLine1, menuLine2, menuLine3);

  const mobileMenu = document.createElement('div');
  mobileMenu.classList.add('mobile_menu');

  const mobileHeaderRow = document.createElement('div');
  mobileHeaderRow.classList.add('mobile_menu__header');

  const mobileLogo = document.createElement('div');
  mobileLogo.classList.add('mobile_menu__logo');

  const mobileLogoImg = document.createElement('img');
  mobileLogoImg.classList.add('mobile_menu__logo-image');
  mobileLogoImg.src = logoPath;
  mobileLogoImg.alt = 'Logo';

  const mobileLogoName = document.createElement('span');
  mobileLogoName.classList.add('mobile_menu__logo-name');
  mobileLogoName.textContent = 'MiniGames';

  mobileLogo.append(mobileLogoImg, mobileLogoName);

  const mobileMenuButton = document.createElement('button');
  mobileMenuButton.type = 'button';
  mobileMenuButton.classList.add('button', 'menu__button', 'active');
  mobileMenuButton.setAttribute('aria-label', 'Close menu');

  const mobileMenuLine1 = document.createElement('span');
  const mobileMenuLine2 = document.createElement('span');
  const mobileMenuLine3 = document.createElement('span');
  mobileMenuButton.append(mobileMenuLine1, mobileMenuLine2, mobileMenuLine3);

  mobileHeaderRow.append(mobileLogo, mobileMenuButton);

  const mobileNavbar = document.createElement('ul');
  mobileNavbar.classList.add('mobile_menu__navbar');

  const mobileLinks = navLinks.map((link) => {
    const mobileNavItem = document.createElement('li');
    mobileNavItem.classList.add('mobile_menu__item');

    const linkElement = document.createElement('a');
    linkElement.href = link.path;
    linkElement.textContent = link.name;
    linkElement.classList.add('mobile_menu__link');

    if (link.name === 'Home') {
      linkElement.classList.add('active');
    }

    mobileNavItem.append(linkElement);
    return mobileNavItem;
  });

  mobileNavbar.append(...mobileLinks);

  const mobileActions = document.createElement('div');
  mobileActions.classList.add('mobile_menu__actions');

  const mobileSignInButton = document.createElement('button');
  mobileSignInButton.classList.add('button', 'signin__button', 'signin__button--mobile');
  mobileSignInButton.textContent = 'Log In';
  mobileSignInButton.addEventListener('click', () => {
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    toggleMenu();
  });

  const mobileSignUpButton = document.createElement('button');
  mobileSignUpButton.classList.add('button', 'signup__button', 'signup__button--mobile');
  mobileSignUpButton.textContent = 'Sign Up';
  mobileSignUpButton.addEventListener('click', () => {
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));
    toggleMenu();
  });

  mobileActions.append(mobileSignInButton, mobileSignUpButton);
  mobileMenu.append(mobileHeaderRow, mobileNavbar, mobileActions);

  actions.append(signInButton, signUpButton, menuButton);
  nav.append(navbar, actions);
  header.append(logo, nav, mobileMenu);

  const toggleMenu = () => {
    const isOpen = header.classList.toggle('menu-open');
    menuButton.classList.toggle('active', isOpen);
    mobileMenu.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    menuButton.setAttribute('aria-expanded', String(isOpen));
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      toggleMenu();
    }
  });

  menuButton.addEventListener('click', toggleMenu);

  for (const mobileNavItem of mobileLinks) {
    const mobileLink = mobileNavItem.querySelector('a');
    mobileLink?.addEventListener('click', toggleMenu);
  }

  mobileMenuButton.addEventListener('click', toggleMenu);

  return header;
}
