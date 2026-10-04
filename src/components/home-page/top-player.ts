import type { LeaderboardPlayerI } from '@/utils/type';
import '@/styles/components/player-table.scss';

const AVATAR_COLORS = ['#ffd02b', '#a3e2c9', '#bce3ff', '#ffc6ff', '#e8dff5'];
const GOLD_COLOR = '#ffd02b';
const DARK_COLOR = '#242145';

function getInitials(name: string): string {
  const parts = name.split(/[_\s]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function formatScore(score: number): string {
  return new Intl.NumberFormat('en-US').format(score);
}

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function createPlayerRow(player: LeaderboardPlayerI, index: number): string {
  const initials = getInitials(player.playerName);
  const avatarColor = getAvatarColor(index);
  const rankColor = player.rank === 1 ? GOLD_COLOR : DARK_COLOR;
  const totalScore = formatScore(player.totalScore);

  return `
    <tr class="top-players__row">
      <td class="top-players__cell top-players__cell--rank">
        <span class="top-players__rank" style="color: ${rankColor};">#${player.rank}</span>
      </td>
      <td class="top-players__cell top-players__cell--player">
        <div class="top-players__player">
          <span class="top-players__avatar" style="background-color: ${avatarColor};">${initials}</span>
          <span class="top-players__name">${player.playerName}</span>
        </div>
      </td>
      <td class="top-players__cell">
        <span class="top-players__value">${player.gamesPlayed}</span>
      </td>
      <td class="top-players__cell">
        <span class="top-players__value top-players__value--score">${totalScore}</span>
      </td>
      <td class="top-players__cell">
        <span class="top-players__streak top-players__streak--full">🔥 ${player.streakDays} days</span>
        <span class="top-players__streak top-players__streak--short">🔥 ${player.streakDays} d</span>
      </td>
      <td class="top-players__cell top-players__cell--favorite">
        <span class="top-players__badge">${player.favoriteGameName}</span>
      </td>
    </tr>
  `;
}

export function createTopPlayers(players: LeaderboardPlayerI[]): HTMLElement {
  const leaderboard = document.createElement('section');

  leaderboard.classList.add('section__leaderboard');

  const rows = players.map((player, index) => createPlayerRow(player, index)).join('');

  leaderboard.innerHTML = `
    <div class="container">
      <div class="leaderboard__title">
        <div class="subtitle">
          <div class="subtitle_accent"></div>
          <h2 class="subtitle_title--full">Top Players This Week</h2>
          <h2 class="subtitle_title--short">Top Players</h2>
        </div>
      </div>

      <div class="leaderboard__table-wrap">
        <table class="top-players__table">
          <thead>
            <tr class="top-players__row top-players__row--header">
              <th class="top-players__cell top-players__cell--head top-players__cell--rank">
                <span class="top-players__cell-label">Rank</span>
              </th>
              <th class="top-players__cell top-players__cell--head top-players__cell--player">
                <span class="top-players__cell-label">Player</span>
              </th>
              <th class="top-players__cell top-players__cell--head">
                <span class="top-players__cell-label--full">Games Played</span>
                <span class="top-players__cell-label--short">Games</span>
              </th>
              <th class="top-players__cell top-players__cell--head">
                <span class="top-players__cell-label--full">Total Score</span>
                <span class="top-players__cell-label--short">Score</span>
              </th>
              <th class="top-players__cell top-players__cell--head">
                <span class="top-players__cell-label">Streak</span>
              </th>
              <th class="top-players__cell top-players__cell--head">
                <span class="top-players__cell-label">Favorite Game</span>
              </th>
            </tr>
          </thead>
          <tbody class="top-players__tbody">
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return leaderboard;
}
