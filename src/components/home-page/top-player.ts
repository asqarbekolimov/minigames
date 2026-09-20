import '@/styles/components/player-table.scss';

const players = [
  {
    rank: 1,
    initials: 'AP',
    name: 'Alex_Pro99',
    gamesPlayed: 142,
    totalScore: '94,250',
    streak: '12 days',
    favoriteGame: 'Heartopia',
    avatarColor: '#ffd02b',
    rankColor: '#ffd02b',
  },
  {
    rank: 2,
    initials: 'CG',
    name: 'CozyGamer_x',
    gamesPlayed: 118,
    totalScore: '81,400',
    streak: '8 days',
    favoriteGame: 'Cat Mail Co.',
    avatarColor: '#a3e2c9',
    rankColor: '#242145',
  },
  {
    rank: 3,
    initials: 'MM',
    name: 'MatchMaster',
    gamesPlayed: 98,
    totalScore: '72,110',
    streak: '5 days',
    favoriteGame: 'Tiny Glade',
    avatarColor: '#bce3ff',
    rankColor: '#242145',
  },
  {
    rank: 4,
    initials: 'BP',
    name: 'BubblePop',
    gamesPlayed: 87,
    totalScore: '65,900',
    streak: '3 days',
    favoriteGame: 'Whisper of the House',
    avatarColor: '#ffc6ff',
    rankColor: '#242145',
  },
  {
    rank: 5,
    initials: 'SG',
    name: 'SudokuGod',
    gamesPlayed: 74,
    totalScore: '59,320',
    streak: '2 days',
    favoriteGame: 'Cat Chess',
    avatarColor: '#e8dff5',
    rankColor: '#242145',
  },
];

export function createTopPlayers(): HTMLElement {
  const leaderboard = document.createElement('section');

  leaderboard.classList.add('section__leaderboard');

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
            ${players
              .map(
                (player) => `
                  <tr class="top-players__row">
                    <td class="top-players__cell top-players__cell--rank">
                      <span class="top-players__rank" style="color: ${player.rankColor};">#${player.rank}</span>
                    </td>
                    <td class="top-players__cell top-players__cell--player">
                      <div class="top-players__player">
                        <span class="top-players__avatar" style="background-color: ${player.avatarColor};">${player.initials}</span>
                        <span class="top-players__name">${player.name}</span>
                      </div>
                    </td>
                    <td class="top-players__cell">
                      <span class="top-players__value">${player.gamesPlayed}</span>
                    </td>
                    <td class="top-players__cell">
                      <span class="top-players__value top-players__value--score">${player.totalScore}</span>
                    </td>
                    <td class="top-players__cell">
                      <span class="top-players__streak top-players__streak--full">🔥 ${player.streak}</span>
                      <span class="top-players__streak top-players__streak--short">🔥 ${player.streak.replace(' days', ' d')}</span>
                    </td>
                    <td class="top-players__cell top-players__cell--favorite">
                      <span class="top-players__badge">${player.favoriteGame}</span>
                    </td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return leaderboard;
}
