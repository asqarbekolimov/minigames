import dividerImage from '@/assets/icons/login-divider.svg';
import googleImage from '@/assets/icons/google.svg';

export function createLoginForm(): HTMLFormElement {
  const form = document.createElement('form');
  form.classList.add('login-form');
  form.innerHTML = `
    <label class="login-field">
      <span>Email Address</span>
      <span class="login-field__control">
        <span class="login-field__icon login-field__icon--mail" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M1.5 12C1.08333 12 0.729167 11.8542 0.4375 11.5625C0.145833 11.2708 1.78814e-07 10.9167 1.78814e-07 10.5V1.5C1.78814e-07 1.08333 0.145833 0.729166 0.4375 0.437499C0.729167 0.145832 1.08333 -1.43051e-06 1.5 -1.43051e-06H14.5C14.9167 -1.43051e-06 15.2708 0.145832 15.5625 0.437499C15.8542 0.729166 16 1.08333 16 1.5V10.5C16 10.9167 15.8542 11.2708 15.5625 11.5625C15.2708 11.8542 14.9167 12 14.5 12H1.5ZM8 7L1.5 3.27083V10.5H14.5V3.27083L8 7ZM8 5.22917L14.5 1.5H1.5L8 5.22917ZM1.5 3.27083V1.5V3.27083V10.5V3.27083Z" fill="#5F5D75"/></svg>
        </span>
        <input type="email" placeholder="e.g. alex@minigames.com" aria-label="Email Address">
      </span>
    </label>

    <label class="login-field">
      <span>Password</span>
      <span class="login-field__control">
        <span class="login-field__icon login-field__icon--lock" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="17" viewBox="0 0 12 17" fill="none"><path d="M1.5 17C1.08333 17 0.729167 16.8542 0.4375 16.5625C0.145834 16.2708 3.57628e-07 15.9167 3.57628e-07 15.5V7.5C3.57628e-07 7.08333 0.145834 6.72917 0.4375 6.4375C0.729167 6.14583 1.08333 6 1.5 6H2V4C2 2.88889 2.38889 1.94444 3.16667 1.16667C3.94444 0.388888 4.88889 -9.53674e-07 6 -9.53674e-07C7.11111 -9.53674e-07 8.05556 0.388888 8.83333 1.16667C9.61111 1.94444 10 2.88889 10 4V6H10.5C10.9167 6 11.2708 6.14583 11.5625 6.4375C11.8542 6.72917 12 7.08333 12 7.5V15.5C12 15.9167 11.8542 16.2708 11.5625 16.5625C11.2708 16.8542 10.9167 17 10.5 17H1.5ZM1.5 15.5H10.5V7.5H1.5V15.5ZM6 13C6.41667 13 6.77083 12.8542 7.0625 12.5625C7.35417 12.2708 7.5 11.9167 7.5 11.5C7.5 11.0833 7.35417 10.7292 7.0625 10.4375C6.77083 10.1458 6.41667 10 6 10C5.58333 10 5.22917 10.1458 4.9375 10.4375C4.64583 10.7292 4.5 11.0833 4.5 11.5C4.5 11.9167 4.64583 12.2708 4.9375 12.5625C5.22917 12.8542 5.58333 13 6 13ZM3.5 6H8.5V4C8.5 3.30555 8.25695 2.71528 7.77083 2.22917C7.28472 1.74305 6.69444 1.5 6 1.5C5.30556 1.5 4.71528 1.74305 4.22917 2.22917C3.74306 2.71528 3.5 3.30555 3.5 4V6ZM1.5 15.5V7.5V15.5Z" fill="#5F5D75"/></svg>
        </span>
        <input class="password-input" type="password" placeholder="********" aria-label="Password">
        <button class="password-toggle" type="button" aria-label="Show password" aria-pressed="false">
          <span class="password-toggle__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M9 9.5C9.97222 9.5 10.7986 9.15972 11.4792 8.47917C12.1597 7.79861 12.5 6.97222 12.5 6C12.5 5.02778 12.1597 4.20139 11.4792 3.52083C10.7986 2.84028 9.97222 2.5 9 2.5C8.02778 2.5 7.20139 2.84028 6.52083 3.52083C5.84028 4.20139 5.5 5.02778 5.5 6C5.5 6.97222 5.84028 7.79861 6.52083 8.47917C7.20139 9.15972 8.02778 9.5 9 9.5ZM9 8C8.44444 8 7.97222 7.80556 7.58333 7.41667C7.19444 7.02778 7 6.55556 7 6C7 5.44444 7.19444 4.97222 7.58333 4.58333C7.97222 4.19444 8.44444 4 9 4C9.55556 4 10.0278 4.19444 10.4167 4.58333C10.8056 4.97222 11 5.44444 11 6C11 6.55556 10.8056 7.02778 10.4167 7.41667C10.0278 7.80556 9.55556 8 9 8ZM9 12C7.01389 12 5.20833 11.4583 3.58333 10.375C1.95833 9.27778 0.763889 7.81944 8.9407e-08 6C0.763889 4.18056 1.95833 2.72917 3.58333 1.64583C5.20833 0.54861 7.01389 -1.43051e-06 9 -1.43051e-06C10.9861 -1.43051e-06 12.7917 0.54861 14.4167 1.64583C16.0417 2.72917 17.2361 4.18056 18 6C17.2361 7.81944 16.0417 9.27778 14.4167 10.375C12.7917 11.4583 10.9861 12 9 12ZM9 10.5C10.5556 10.5 11.9931 10.0972 13.3125 9.29167C14.6319 8.48611 15.6458 7.38889 16.3542 6C15.6458 4.61111 14.6319 3.51389 13.3125 2.70833C11.9931 1.90278 10.5556 1.5 9 1.5C7.44444 1.5 6.00694 1.90278 4.6875 2.70833C3.36806 3.51389 2.35417 4.61111 1.64583 6C2.35417 7.38889 3.36806 8.48611 4.6875 9.29167C6.00694 10.0972 7.44444 10.5 9 10.5Z" fill="#5F5D75"/></svg>
          </span>
        </button>
      </span>
    </label>

    <a class="login-form__forgot" href="#">Forgot Password?</a>
    ${createActionsMarkup('Login')}
  `;

  setupPasswordToggle(form);
  form.addEventListener('submit', (event) => event.preventDefault());
  return form;
}

function createActionsMarkup(submitText: string): string {
  return `
    <div class="login-actions">
      <button class="login-actions__submit" type="submit">${submitText}</button>
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
