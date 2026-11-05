import {
  createAsyncContent,
  createErrorBanner,
  createSkeleton,
} from '@/components/common/async-content';
import { showSnackbar } from '@/components/common/snackbar';
import {
  ApiError,
  getComments,
  getGameDetails,
  postComment,
  toggleCommentLike,
  toggleFavorite,
} from '@/services/api';
import { getCurrentSession, isSessionActive } from '@/services/auth';
import { deriveDisplayName, type AppSession } from '@/services/session';
import { play } from '@/utils/sounds';
import type { ApiResponseI, CommentI, GameDetailsI, TopRecordI } from '@/utils/type';
import './game-details.scss';

function requestAuthentication(): void {
  globalThis.dispatchEvent(new CustomEvent('auth-required-for-action'));
}

const COMMENT_MAX_HEIGHT = 88;
const COMMENT_MAX_LENGTH = 500;

const starIcon = `<svg class="game-details__icon game-details__icon--star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8.85 17.825L12 15.925L15.15 17.85L14.325 14.25L17.1 11.85L13.45 11.525L12 8.125L10.55 11.5L6.9 11.825L9.675 14.25L8.85 17.825ZM5.825 22L7.45 14.975L2 10.25L9.2 9.625L12 3L14.8 9.625L22 10.25L16.55 14.975L18.175 22L12 18.275L5.825 22Z" fill="currentColor"/></svg>`;

const heartIcon = `<svg class="game-details__icon game-details__icon--heart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20.9999L10.55 19.6999C8.86667 18.1832 7.475 16.8749 6.375 15.7749C5.275 14.6749 4.4 13.6916 3.75 12.8249C3.1 11.9416 2.64167 11.1332 2.375 10.3999C2.125 9.66657 2 8.91657 2 8.1499C2 6.58324 2.525 5.2749 3.575 4.2249C4.625 3.1749 5.93333 2.6499 7.5 2.6499C8.36667 2.6499 9.19167 2.83324 9.975 3.1999C10.7583 3.56657 11.4333 4.08324 12 4.7499C12.5667 4.08324 13.2417 3.56657 14.025 3.1999C14.8083 2.83324 15.6333 2.6499 16.5 2.6499C18.0667 2.6499 19.375 3.1749 20.425 4.2249C21.475 5.2749 22 6.58324 22 8.1499C22 8.91657 21.8667 9.66657 21.6 10.3999C21.35 11.1332 20.9 11.9416 20.25 12.8249C19.6 13.6916 18.725 14.6749 17.625 15.7749C16.525 16.8749 15.1333 18.1832 13.45 19.6999L12 20.9999ZM12 18.2999C13.6 16.8666 14.9167 15.6416 15.95 14.6249C16.9833 13.5916 17.8 12.6999 18.4 11.9499C19 11.1832 19.4167 10.5082 19.65 9.9249C19.8833 9.3249 20 8.73324 20 8.1499C20 7.1499 19.6667 6.31657 19 5.6499C18.3333 4.98324 17.5 4.6499 16.5 4.6499C15.7167 4.6499 14.9917 4.8749 14.325 5.3249C13.6583 5.75824 13.2 6.31657 12.95 6.9999H11.05C10.8 6.31657 10.3417 5.75824 9.675 5.3249C9.00833 4.8749 8.28333 4.6499 7.5 4.6499C6.5 4.6499 5.66667 4.98324 5 5.6499C4.33333 6.31657 4 7.1499 4 8.1499C4 8.73324 4.11667 9.3249 4.35 9.9249C4.58333 10.5082 5 11.1832 5.6 11.9499C6.2 12.6999 7.01667 13.5916 8.05 14.6249C9.08333 15.6416 10.4 16.8666 12 18.2999Z" fill="currentColor"/></svg>`;

const closeIcon = `<svg class="game-details__close-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18.3 5.71004L12 12.01L5.70001 5.71004L4.29001 7.12004L10.59 13.42L4.29001 19.72L5.70001 21.13L12 14.83L18.3 21.13L19.71 19.72L13.41 13.42L19.71 7.12004L18.3 5.71004Z" fill="currentColor"/></svg>`;

const sendIcon = `<svg class="game-details__send-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/></svg>`;

const medals = ['🥇', '🥈', '🥉'];

export function createGameDetails(gameSlug: string): HTMLElement {
  const page = document.createElement('div');
  page.classList.add('game-details-page');

  page.innerHTML = `
    <div class="game-details" role="dialog" aria-modal="true" aria-label="Game details">
      <div class="game-details__hero">
        <button class="game-details__close" type="button" aria-label="Close dialog">${closeIcon}</button>
      </div>
      <div class="game-details__body" data-game-body></div>
    </div>
  `;

  setupDismiss(page);
  page.addEventListener('game-details-resume', () => void hydrate(page, gameSlug));
  void hydrate(page, gameSlug);

  return page;
}

function setupDismiss(page: HTMLElement): void {
  const closeButton = page.querySelector<HTMLButtonElement>('.game-details__close');

  closeButton?.addEventListener('click', () => {
    play('hush', { volume: 0.7 });
    page.dispatchEvent(new Event('game-details-close'));
  });

  page.addEventListener('click', (event) => {
    if (event.target !== page) return;

    play('hush', { volume: 0.7 });
    page.dispatchEvent(new Event('game-details-close'));
  });
}

async function hydrate(page: HTMLElement, gameSlug: string): Promise<void> {
  const body = page.querySelector<HTMLElement>('[data-game-body]');
  if (!body) return;

  body.replaceChildren(createSkeleton({ variant: 'details', count: 1 }));

  const userEmail = isSessionActive() ? getCurrentSession()?.email : undefined;

  try {
    const gameResponse = await getGameDetails(gameSlug, userEmail);

    renderGameDetails(page, body, gameResponse.data, gameSlug);
  } catch (error) {
    showSnackbar({ message: getErrorMessage(error), variant: 'error' });

    body.replaceChildren(
      createErrorBanner({
        message: getErrorMessage(error),
        retryLabel: 'Try again',
        onRetry: () => void hydrate(page, gameSlug),
      }),
    );
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  return 'Something went wrong while loading this game. Please try again.';
}

function renderGameDetails(
  page: HTMLElement,
  body: HTMLElement,
  game: GameDetailsI,
  gameSlug: string,
): void {
  const dialog = page.querySelector<HTMLElement>('.game-details');
  const hero = page.querySelector<HTMLElement>('.game-details__hero');

  if (dialog) {
    dialog.setAttribute('aria-labelledby', 'game-details-title');
    dialog.removeAttribute('aria-label');
  }

  if (hero) {
    hero.querySelector('.game-details__hero-image')?.remove();

    const heroImage = document.createElement('img');
    heroImage.classList.add('game-details__hero-image');
    heroImage.src = game.heroImage;
    heroImage.alt = `${game.name} cover art`;
    hero.prepend(heroImage);
  }

  const isFavorited = game.isLikedByCurrentUser;
  const session = isSessionActive() ? getCurrentSession() : undefined;

  body.innerHTML = `
    <div class="game-details__header">
      <h2 class="game-details__title" id="game-details-title">${game.name}</h2>
      <ul class="game-details__stats">
        <li class="game-details__stat">${starIcon}<span data-game-rating>${game.rating}</span></li>
        <li class="game-details__stat">${heartIcon}<span data-game-likes>${formatCompactNumber(game.likesCount)}</span></li>
      </ul>
    </div>

    <p class="game-details__description" data-game-description>${game.fullDescription}</p>

    <ul class="game-details__widgets">
      <li class="widget"><span class="widget__label">Genre</span><span class="widget__value" data-spec-genre>${game.specs.genre}</span></li>
      <li class="widget"><span class="widget__label">Players</span><span class="widget__value" data-spec-players>${game.specs.players}</span></li>
      <li class="widget"><span class="widget__label">Duration</span><span class="widget__value" data-spec-duration>${game.specs.duration}</span></li>
      <li class="widget"><span class="widget__label">Price</span><span class="widget__value" data-spec-price>${game.specs.price}</span></li>
    </ul>

    <div class="game-details__actions">
      <button class="game-details__play" type="button">Play Now</button>
      <button class="game-details__favorite${isFavorited ? ' is-active' : ''}" type="button" aria-pressed="${isFavorited}" aria-label="${isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}">
        ${heartIcon}
        <span class="game-details__favorite-label">${isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        <span class="game-details__favorite-spinner" aria-hidden="true"></span>
      </button>
    </div>

    <section class="game-details__section" aria-labelledby="game-details-records-title">
      <h3 class="game-details__section-title" id="game-details-records-title">
        <span class="game-details__emoji" aria-hidden="true">🏆</span> Top Records
      </h3>
      <ol class="records" data-game-records></ol>
    </section>

    <section class="game-details__section" aria-labelledby="game-details-comments-title">
      <h3 class="game-details__section-title" id="game-details-comments-title" data-comments-title>Comments</h3>

      ${session ? renderCommentForm(session) : renderLockedCommentForm()}

      <div data-comments-content></div>
    </section>
  `;

  renderRecords(body, game.topRecords);
  setupPlayButton(page);
  setupFavoriteToggle(page, gameSlug);

  const commentsElement = body.querySelector<HTMLElement>('[data-comments-content]');
  const comments = commentsElement
    ? createCommentsSection(commentsElement, body, gameSlug)
    : undefined;

  if (comments) {
    setupCommentLikes(commentsElement ?? body);
    setupCommentForm(body, gameSlug, () => comments.reload());
  }
}

function renderCommentForm(session: AppSession): string {
  return `
    <form class="comment-form">
      <span class="comment-form__avatar" aria-hidden="true">${getAvatarInitial(session.displayName)}</span>
      <label class="visually-hidden" for="game-details-comment">Add a comment</label>
      <textarea
        class="comment-form__textarea"
        id="game-details-comment"
        name="comment"
        rows="1"
        maxlength="${COMMENT_MAX_LENGTH}"
        placeholder="Write a comment..."
      ></textarea>
      <button class="comment-form__send" type="submit" aria-label="Send comment">${sendIcon}</button>
    </form>
  `;
}

function renderLockedCommentForm(): string {
  return `
    <div class="comment-form comment-form--locked">
      <span class="comment-form__avatar" aria-hidden="true">?</span>
      <p class="comment-form__locked-text">Sign in to join the conversation.</p>
      <button class="comment-form__sign-in" type="button" data-comment-sign-in>Sign in</button>
    </div>
  `;
}

function createCommentsSection(
  host: HTMLElement,
  body: HTMLElement,
  gameSlug: string,
): { reload: () => Promise<void> } {
  const comments = createAsyncContent<ApiResponseI<CommentI[]>>({
    load: async () => {
      const response = await getComments(gameSlug, {
        limit: 3,
        sort: 'newest',
        userEmail: isSessionActive() ? getCurrentSession()?.email : undefined,
      });

      updateCommentsTitle(body, response.meta?.totalComments ?? response.data.length);

      return response;
    },
    render: (response) => createCommentsList(response.data),
    isEmpty: (response) => response.data.length === 0,
    renderSkeleton: () => createSkeleton({ variant: 'text', count: 3 }),
    errorMessage: getErrorMessage,
    retryLabel: 'Try again',
    empty: {
      title: 'No comments yet',
      message: 'Be the first to share your thoughts about this game.',
    },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), variant: 'error' });
    },
  });

  host.append(comments.element);
  void comments.reload();

  return comments;
}

function updateCommentsTitle(body: HTMLElement, totalComments: number): void {
  const title = body.querySelector<HTMLElement>('[data-comments-title]');
  if (title) title.textContent = `Comments (${totalComments})`;
}

function setupPlayButton(page: HTMLElement): void {
  const playButton = page.querySelector<HTMLButtonElement>('.game-details__play');
  playButton?.addEventListener('click', () => play('landed'));
}

function setupFavoriteToggle(page: HTMLElement, gameSlug: string): void {
  const favoriteButton = page.querySelector<HTMLButtonElement>('.game-details__favorite');
  if (!favoriteButton) return;

  favoriteButton.addEventListener('click', () => {
    void toggleFavoriteState(page, favoriteButton, gameSlug);
  });
}

async function toggleFavoriteState(
  page: HTMLElement,
  button: HTMLButtonElement,
  gameSlug: string,
): Promise<void> {
  if (!isSessionActive()) {
    showSnackbar({ message: 'Sign in to add favorites.', variant: 'warning' });
    requestAuthentication();
    return;
  }

  const session = getCurrentSession();

  if (!session || button.dataset.pending === 'true') return;

  setFavoritePending(button, true);

  try {
    const response = await toggleFavorite(gameSlug, session.email);

    applyFavoriteState(page, button, response.data.isFavorited, response.data.likesCount);
    play(response.data.isFavorited ? 'perk' : 'hush', { volume: 0.8 });
  } catch (error) {
    const isAmbiguous = isAmbiguousRequestError(error);

    showSnackbar({
      message: isAmbiguous
        ? 'We could not confirm your favorite change. Check the button before trying again.'
        : getErrorMessage(error),
      variant: isAmbiguous ? 'warning' : 'error',
    });
  } finally {
    setFavoritePending(button, false);
  }
}

function setFavoritePending(button: HTMLButtonElement, isPending: boolean): void {
  button.disabled = isPending;
  button.classList.toggle('is-loading', isPending);
  button.setAttribute('aria-busy', String(isPending));
  button.dataset.pending = String(isPending);
}

function applyFavoriteState(
  page: HTMLElement,
  button: HTMLButtonElement,
  isFavorited: boolean,
  likesCount: number,
): void {
  const labelText = isFavorited ? 'Remove from Favorites' : 'Add to Favorites';

  button.classList.toggle('is-active', isFavorited);
  button.setAttribute('aria-pressed', String(isFavorited));
  button.setAttribute('aria-label', labelText);

  const label = button.querySelector<HTMLElement>('.game-details__favorite-label');
  if (label) label.textContent = labelText;

  const likes = page.querySelector<HTMLElement>('[data-game-likes]');
  if (likes) likes.textContent = formatCompactNumber(likesCount);
}

function setupCommentForm(
  body: HTMLElement,
  gameSlug: string,
  refreshComments: () => Promise<void>,
): void {
  const signInButton = body.querySelector<HTMLButtonElement>('[data-comment-sign-in]');
  signInButton?.addEventListener('click', () => {
    showSnackbar({ message: 'Sign in to comment.', variant: 'warning' });
    requestAuthentication();
  });

  const form = body.querySelector<HTMLFormElement>('.comment-form');
  const textarea = body.querySelector<HTMLTextAreaElement>('.comment-form__textarea');
  const sendButton = body.querySelector<HTMLButtonElement>('.comment-form__send');

  if (!form || !textarea || !sendButton) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitComment(form, textarea, sendButton, gameSlug, refreshComments);
  });

  textarea.addEventListener('input', () => resizeTextarea(textarea));

  textarea.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    form.requestSubmit();
  });
}

async function submitComment(
  form: HTMLFormElement,
  textarea: HTMLTextAreaElement,
  sendButton: HTMLButtonElement,
  gameSlug: string,
  refreshComments: () => Promise<void>,
): Promise<void> {
  if (textarea.disabled) return;

  if (!isSessionActive()) {
    requestAuthentication();
    return;
  }

  const session = getCurrentSession();
  if (!session) {
    requestAuthentication();
    return;
  }

  const text = textarea.value.trim();

  if (!text) {
    showSnackbar({ message: 'Please write a comment before sending.', variant: 'warning' });
    textarea.focus();
    return;
  }

  if (text.length > COMMENT_MAX_LENGTH) {
    showSnackbar({
      message: `Comments can be at most ${COMMENT_MAX_LENGTH} characters long.`,
      variant: 'warning',
    });
    textarea.focus();
    return;
  }

  setCommentFormPending(form, textarea, sendButton, true);

  let wasCreated = false;

  try {
    await postComment(gameSlug, {
      userEmail: session.email,
      authorName: formatAuthorName(session),
      text,
    });
    wasCreated = true;
  } catch (error) {
    const isAmbiguous = isAmbiguousRequestError(error);

    showSnackbar({
      message: isAmbiguous
        ? 'We could not confirm whether your comment was posted. Check the list before trying again.'
        : getErrorMessage(error),
      variant: isAmbiguous ? 'warning' : 'error',
    });
  } finally {
    setCommentFormPending(form, textarea, sendButton, false);
  }

  if (!wasCreated) return;

  textarea.value = '';
  resizeTextarea(textarea);
  play('paid', { volume: 0.7 });
  showSnackbar({ message: 'Your comment has been posted.', variant: 'success' });

  await refreshComments();
}

function setCommentFormPending(
  form: HTMLFormElement,
  textarea: HTMLTextAreaElement,
  sendButton: HTMLButtonElement,
  isPending: boolean,
): void {
  form.classList.toggle('comment-form--pending', isPending);
  form.setAttribute('aria-busy', String(isPending));
  textarea.disabled = isPending;
  sendButton.disabled = isPending;
}

function isAmbiguousRequestError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;

  return error.status === 0 || error.status === 408 || error.status >= 500;
}

function formatAuthorName(session: AppSession): string {
  const name = [...session.displayName.trim()].slice(0, 30).join('');
  return name.length >= 2 ? name : deriveDisplayName(session.email);
}

function getAvatarInitial(name: string): string {
  const firstCharacter = [...name.trim()][0];

  return firstCharacter ? firstCharacter.toUpperCase() : 'U';
}

function resizeTextarea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = 'auto';
  const nextHeight = Math.min(textarea.scrollHeight, COMMENT_MAX_HEIGHT);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > COMMENT_MAX_HEIGHT ? 'auto' : 'hidden';
}

function setupCommentLikes(container: HTMLElement): void {
  container.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest<HTMLButtonElement>('.comment__like');
    if (!button || button.disabled) return;

    void toggleCommentLikeState(button);
  });
}

async function toggleCommentLikeState(button: HTMLButtonElement): Promise<void> {
  if (!isSessionActive()) {
    showSnackbar({ message: 'Sign in to like comments.', variant: 'warning' });
    requestAuthentication();
    return;
  }

  const session = getCurrentSession();
  const commentId = button.dataset.commentId;

  if (!session || !commentId || button.dataset.pending === 'true') return;

  setCommentLikePending(button, true);

  try {
    const response = await toggleCommentLike(commentId, session.email);

    applyCommentLikeState(button, response.data.isLikedByCurrentUser, response.data.likesCount);
    play(response.data.isLikedByCurrentUser ? 'tick' : 'plop', { volume: 0.6 });
  } catch (error) {
    const isAmbiguous = isAmbiguousRequestError(error);

    showSnackbar({
      message: isAmbiguous
        ? 'We could not confirm your like. Check the comment before trying again.'
        : getErrorMessage(error),
      variant: isAmbiguous ? 'warning' : 'error',
    });
  } finally {
    setCommentLikePending(button, false);
  }
}

function setCommentLikePending(button: HTMLButtonElement, isPending: boolean): void {
  button.disabled = isPending;
  button.classList.toggle('is-loading', isPending);
  button.setAttribute('aria-busy', String(isPending));
  button.dataset.pending = String(isPending);
}

function applyCommentLikeState(
  button: HTMLButtonElement,
  isLiked: boolean,
  likesCount: number,
): void {
  button.classList.toggle('is-active', isLiked);
  button.setAttribute('aria-pressed', String(isLiked));
  button.setAttribute('aria-label', isLiked ? 'Remove like' : 'Like comment');

  const count = button.querySelector<HTMLElement>('.comment__like-count');
  if (count) count.textContent = String(likesCount);
}

function renderRecords(body: HTMLElement, records: TopRecordI[]): void {
  const list = body.querySelector<HTMLElement>('[data-game-records]');
  if (!list) return;

  list.replaceChildren(...records.map((record) => createRecordRow(record)));
}

function createRecordRow(record: TopRecordI): HTMLLIElement {
  const row = document.createElement('li');
  const medal = medals[record.position - 1] ?? `#${record.position}`;

  row.classList.add('records__row');
  row.innerHTML = `
    <span class="records__player">
      <span class="records__medal" aria-hidden="true">${medal}</span>
      <span class="records__name">${record.playerName}</span>
    </span>
    <span class="records__meta">
      <span class="records__score">${formatNumber(record.score)} pts</span>
      <span class="records__date">${formatRelativeTime(record.achievedAt)}</span>
    </span>
  `;
  return row;
}

function createCommentsList(comments: CommentI[]): HTMLElement {
  const list = document.createElement('ul');
  list.classList.add('comments');
  list.dataset.gameComments = '';
  list.replaceChildren(...comments.map((comment, index) => createCommentItem(comment, index)));

  return list;
}

function createCommentItem(comment: CommentI, index: number): HTMLLIElement {
  const item = document.createElement('li');
  const avatarColorIndex = (index % 5) + 1;
  const liked = comment.isLikedByCurrentUser;

  item.classList.add('comment');
  item.innerHTML = `
    <div class="comment__header">
      <span class="comment__author">
        <span class="comment__avatar comment__avatar--${avatarColorIndex}" aria-hidden="true"></span>
        <span class="comment__name"></span>
      </span>
      <time class="comment__date"></time>
    </div>
    <p class="comment__text"></p>
    <button class="comment__like${liked ? ' is-active' : ''}" type="button" aria-pressed="${liked}" aria-label="${liked ? 'Remove like' : 'Like comment'}">
      ${heartIcon}
      <span class="comment__like-count"></span>
      <span class="comment__like-spinner" aria-hidden="true"></span>
    </button>
  `;

  const avatar = item.querySelector<HTMLElement>('.comment__avatar');
  const author = item.querySelector<HTMLElement>('.comment__name');
  const date = item.querySelector<HTMLTimeElement>('.comment__date');
  const text = item.querySelector<HTMLElement>('.comment__text');
  const likeButton = item.querySelector<HTMLButtonElement>('.comment__like');
  const likeCount = item.querySelector<HTMLElement>('.comment__like-count');

  if (likeButton) likeButton.dataset.commentId = comment.commentId;

  if (avatar) avatar.textContent = getInitials(comment.authorName);
  if (author) author.textContent = comment.authorName;
  if (date) {
    date.dateTime = comment.createdAt;
    date.textContent = formatRelativeTime(comment.createdAt);
  }
  if (text) text.textContent = comment.text;
  if (likeCount) likeCount.textContent = String(comment.likesCount);

  return item;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatRelativeTime(value: string): string {
  const elapsedSeconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

  if (elapsedSeconds < 60) return 'just now';

  const units: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'minute'],
    [3600, 'hour'],
    [86_400, 'day'],
    [604_800, 'week'],
    [2_592_000, 'month'],
  ];

  let chosen: [number, Intl.RelativeTimeFormatUnit] = units[0];
  for (const unit of units) {
    if (elapsedSeconds >= unit[0]) chosen = unit;
  }

  const amount = Math.round(elapsedSeconds / chosen[0]);
  return new Intl.RelativeTimeFormat('en-US', { numeric: 'always' }).format(-amount, chosen[1]);
}
