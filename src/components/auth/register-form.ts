import dividerImage from '@/assets/icons/login-divider.svg';
import googleImage from '@/assets/icons/google.svg';

export function createRegisterForm(): HTMLFormElement {
  const form = document.createElement('form');
  form.classList.add('login-form');
  form.innerHTML = `
    <div class="login-field">
      <label for="register-username">Username</label>
      <span class="login-field__control">
        <span class="login-field__icon login-field__icon--mail" aria-hidden="true">
         <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 6C5.16667 6 4.45833 5.70833 3.875 5.125C3.29167 4.54167 3 3.83333 3 3C3 2.16667 3.29167 1.45833 3.875 0.875C4.45833 0.291666 5.16667 -1.43051e-06 6 -1.43051e-06C6.83333 -1.43051e-06 7.54167 0.291666 8.125 0.875C8.70833 1.45833 9 2.16667 9 3C9 3.83333 8.70833 4.54167 8.125 5.125C7.54167 5.70833 6.83333 6 6 6ZM3.57628e-07 12V10C3.57628e-07 9.68056 0.0833336 9.38194 0.25 9.10417C0.430556 8.8125 0.673611 8.56944 0.979167 8.375C1.74306 7.93056 2.54861 7.59028 3.39583 7.35417C4.25694 7.11806 5.125 7 6 7C6.875 7 7.73611 7.11806 8.58333 7.35417C9.44445 7.59028 10.2569 7.93056 11.0208 8.375C11.3264 8.55556 11.5625 8.79167 11.7292 9.08333C11.9097 9.375 12 9.68056 12 10V12H3.57628e-07ZM1.5 10.5H10.5V10C10.5 9.93056 10.4792 9.86806 10.4375 9.8125C10.3958 9.74306 10.3403 9.69444 10.2708 9.66667C9.63195 9.27778 8.95139 8.98611 8.22917 8.79167C7.50694 8.59722 6.76389 8.5 6 8.5C5.23611 8.5 4.49306 8.59722 3.77083 8.79167C3.04861 8.98611 2.36806 9.27778 1.72917 9.66667C1.65972 9.72222 1.60417 9.77778 1.5625 9.83333C1.52083 9.875 1.5 9.93056 1.5 10V10.5ZM6 4.5C6.41667 4.5 6.77083 4.35417 7.0625 4.0625C7.35417 3.77083 7.5 3.41667 7.5 3C7.5 2.58333 7.35417 2.22917 7.0625 1.9375C6.77083 1.64583 6.41667 1.5 6 1.5C5.58333 1.5 5.22917 1.64583 4.9375 1.9375C4.64583 2.22917 4.5 2.58333 4.5 3C4.5 3.41667 4.64583 3.77083 4.9375 4.0625C5.22917 4.35417 5.58333 4.5 6 4.5Z" fill="#5F5D75"/></svg>
        </span>
        <input id="register-username" type="email" placeholder="e.g. CozyGamer_99" aria-label="Username">
      </span>
    </div>
    <div class="login-field">
      <label for="register-email">Email Address</label>
      <span class="login-field__control">
        <span class="login-field__icon login-field__icon--mail" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1.5 12C1.08333 12 0.729167 11.8542 0.4375 11.5625C0.145833 11.2708 1.78814e-07 10.9167 1.78814e-07 10.5V1.5C1.78814e-07 1.08333 0.145833 0.729166 0.4375 0.437499C0.729167 0.145832 1.08333 -1.43051e-06 1.5 -1.43051e-06H14.5C14.9167 -1.43051e-06 15.2708 0.145832 15.5625 0.437499C15.8542 0.729166 16 1.08333 16 1.5V10.5C16 10.9167 15.8542 11.2708 15.5625 11.5625C15.2708 11.8542 14.9167 12 14.5 12H1.5ZM8 7L1.5 3.27083V10.5H14.5V3.27083L8 7ZM8 5.22917L14.5 1.5H1.5L8 5.22917ZM1.5 3.27083V1.5V3.27083V10.5V3.27083Z" fill="#5F5D75"/></svg>
        </span>
        <input id="register-email" type="email" placeholder="e.g. alex@minigames.com" aria-label="Email Address">
      </span>
    </div>

    <div class="login-field">
      <label for="register-password">Password</label>
      <span class="login-field__control">
        <span class="login-field__icon login-field__icon--lock" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="17" viewBox="0 0 12 17" fill="none"><path d="M1.5 17C1.08333 17 0.729167 16.8542 0.4375 16.5625C0.145834 16.2708 3.57628e-07 15.9167 3.57628e-07 15.5V7.5C3.57628e-07 7.08333 0.145834 6.72917 0.4375 6.4375C0.729167 6.14583 1.08333 6 1.5 6H2V4C2 2.88889 2.38889 1.94444 3.16667 1.16667C3.94444 0.388888 4.88889 -9.53674e-07 6 -9.53674e-07C7.11111 -9.53674e-07 8.05556 0.388888 8.83333 1.16667C9.61111 1.94444 10 2.88889 10 4V6H10.5C10.9167 6 11.2708 6.14583 11.5625 6.4375C11.8542 6.72917 12 7.08333 12 7.5V15.5C12 15.9167 11.8542 16.2708 11.5625 16.5625C11.2708 16.8542 10.9167 17 10.5 17H1.5ZM1.5 15.5H10.5V7.5H1.5V15.5ZM6 13C6.41667 13 6.77083 12.8542 7.0625 12.5625C7.35417 12.2708 7.5 11.9167 7.5 11.5C7.5 11.0833 7.35417 10.7292 7.0625 10.4375C6.77083 10.1458 6.41667 10 6 10C5.58333 10 5.22917 10.1458 4.9375 10.4375C4.64583 10.7292 4.5 11.0833 4.5 11.5C4.5 11.9167 4.64583 12.2708 4.9375 12.5625C5.22917 12.8542 5.58333 13 6 13ZM3.5 6H8.5V4C8.5 3.30555 8.25695 2.71528 7.77083 2.22917C7.28472 1.74305 6.69444 1.5 6 1.5C5.30556 1.5 4.71528 1.74305 4.22917 2.22917C3.74306 2.71528 3.5 3.30555 3.5 4V6ZM1.5 15.5V7.5V15.5Z" fill="#5F5D75"/></svg>
        </span>
        <input id="register-password" class="password-input" type="password" placeholder="Min. 8 characters" aria-label="Password">
        <button class="password-toggle" type="button" aria-label="Show password" aria-pressed="false">
          <span class="password-toggle__icon" aria-hidden="true"></span>
        </button>
      </span>
    </div>

    <div class="login-field">
      <label for="register-confirm-password">Confirm Password</label>
      <span class="login-field__control">
        <span class="login-field__icon login-field__icon--lock" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="17" viewBox="0 0 12 17" fill="none"><path d="M1.5 17C1.08333 17 0.729167 16.8542 0.4375 16.5625C0.145834 16.2708 3.57628e-07 15.9167 3.57628e-07 15.5V7.5C3.57628e-07 7.08333 0.145834 6.72917 0.4375 6.4375C0.729167 6.14583 1.08333 6 1.5 6H2V4C2 2.88889 2.38889 1.94444 3.16667 1.16667C3.94444 0.388888 4.88889 -9.53674e-07 6 -9.53674e-07C7.11111 -9.53674e-07 8.05556 0.388888 8.83333 1.16667C9.61111 1.94444 10 2.88889 10 4V6H10.5C10.9167 6 11.2708 6.14583 11.5625 6.4375C11.8542 6.72917 12 7.08333 12 7.5V15.5C12 15.9167 11.8542 16.2708 11.5625 16.5625C11.2708 16.8542 10.9167 17 10.5 17H1.5ZM1.5 15.5H10.5V7.5H1.5V15.5ZM6 13C6.41667 13 6.77083 12.8542 7.0625 12.5625C7.35417 12.2708 7.5 11.9167 7.5 11.5C7.5 11.0833 7.35417 10.7292 7.0625 10.4375C6.77083 10.1458 6.41667 10 6 10C5.58333 10 5.22917 10.1458 4.9375 10.4375C4.64583 10.7292 4.5 11.0833 4.5 11.5C4.5 11.9167 4.64583 12.2708 4.9375 12.5625C5.22917 12.8542 5.58333 13 6 13ZM3.5 6H8.5V4C8.5 3.30555 8.25695 2.71528 7.77083 2.22917C7.28472 1.74305 6.69444 1.5 6 1.5C5.30556 1.5 4.71528 1.74305 4.22917 2.22917C3.74306 2.71528 3.5 3.30555 3.5 4V6ZM1.5 15.5V7.5V15.5Z" fill="#5F5D75"/></svg>
        </span>
        <input id="register-confirm-password" type="password" placeholder="Repeat your password" aria-label="Confirm Password">
      </span>
    </div>

    <div class="login-actions">
      <button class="login-actions__submit" type="submit">Create Account</button>
      <div class="login-actions__divider" aria-hidden="true">
        <img src="${dividerImage}" alt="">
        <span>OR</span>
        <img src="${dividerImage}" alt="">
      </div>
      <button class="login-actions__google" type="button">
        <img src="${googleImage}" alt="">
        <span>Continue with Google</span>
      </button>
    </div>
  `;

  setupPasswordToggle(form);
  form.addEventListener('submit', (event) => event.preventDefault());
  return form;
}

function setupPasswordToggle(form: HTMLFormElement): void {
  const passwordInput = form.querySelector<HTMLInputElement>('.password-input');
  const passwordToggle = form.querySelector<HTMLButtonElement>('.password-toggle');

  passwordToggle?.addEventListener('click', () => {
    if (!passwordInput) return;
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    passwordToggle.setAttribute('aria-pressed', String(!isVisible));
    passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
  });
}
