// statsPanel.js
// The stats panel beside the Today screen: skills, energy, morale, and hometown buzz.
// Draw only: it reads the state and returns HTML.

window.Game = window.Game || {};
Game.ui = Game.ui || {};

Game.ui.statsPanel = {

  html: function (state) {
    var b = Game.balance;
    var p = state.player;
    var town = state.cities.hometown;
    var townName = Game.content.cities.hometown.name;

    // Skills: whole number shown, with a thin bar showing the level out of 100.
    var skillRows = Object.keys(Game.content.skills).map(function (skill) {
      var value = p.skills[skill];
      var whole = Math.floor(value);
      var toNext = Math.round((value - whole) * 100);
      var rust = Game.rules.skills.rustStatus(state, skill);
      var days = Game.rules.skills.daysUnused(state, skill);
      var rustIcon = '';
      if (rust) {
        var tip = rust === 'rusting'
          ? 'Rusting: unused for ' + days + ' days. Losing ' + b.skills.rustPerWeek + ' point a week until you use it.'
          : 'Unused for ' + days + ' days. Starts rusting at ' + b.skills.rustAfterDays + '.';
        rustIcon = ' <span class="rust rust--' + rust + '" title="' + tip + '">⚠ ' + (rust === 'rusting' ? 'Rusting' : 'Rust soon') + '</span>';
      }
      return '<div class="skill">' +
        '<span class="skill__name">' + Game.content.skills[skill] + rustIcon + '</span>' +
        '<span class="skill__value">' + whole + '</span>' +
        // The bar shows the skill level out of 100. Hovering shows how close it is to the next whole point.
        '<span class="meter meter--thin" title="' + Game.util.round1(value) + ' of ' + b.skills.max + ' · ' + toNext + '% of the way to ' + (whole + 1) + '">' +
          '<span class="meter__fill" style="width:' + (value / b.skills.max * 100) + '%"></span></span>' +
        '</div>';
    }).join('');

    var energyBadge = Game.rules.energy.isTired(p.energy) ? ' <span class="badge badge--warn">Tired</span>' : '';
    var moraleBadge = p.burnedOut ? ' <span class="badge badge--bad">Burned out</span>' : '';

    return '<div class="panel">' +
      '<h3 class="panel__title">Stats</h3>' +
      '<div class="skills">' + skillRows + '</div>' +
      '<dl class="rows rows--stats">' +
        '<dt>Energy' + energyBadge + '</dt><dd>' + Math.round(p.energy) + ' / ' + b.energy.max + '</dd>' +
        '<dt>Morale' + moraleBadge + '</dt><dd>' + Math.round(p.morale) + ' / ' + b.morale.max + '</dd>' +
        '<dt>' + townName + ' buzz</dt><dd>' + Math.round(town.buzz) + ' / ' + b.buzz.max + '</dd>' +
        '<dt>' + townName + ' fans</dt><dd>' + town.fans.toLocaleString() + '</dd>' +
      '</dl>' +
      '<dl class="rows rows--stats">' +
        '<dt>Job</dt><dd><button class="link-btn" data-action="openJob" title="Open the Day job screen">' +
          (p.job.status === 'none' ? 'None' : (p.job.status === 'full' ? 'Full-time' : 'Part-time') + ' · standing ' + Math.round(p.job.standing)) +
          (p.job.pending ? (p.job.pending.status === 'none' ? ' · quitting' : ' · part-time soon') : '') + ' ›</button></dd>' +
        '<dt>Vacation days</dt><dd>' + p.job.vacationDaysLeft + '</dd>' +
        '<dt>Home</dt><dd>' + Game.balance.housing[p.housing].name + (p.vacationHome ? ' + vacation home' : '') + '</dd>' +
        '<dt>Band</dt><dd>' + (state.band.memberIds.length ? Game.ui.helpers.escape(state.band.name || 'Unnamed') + ' (' + (state.band.memberIds.length + 1) + ')' : 'Solo') + '</dd>' +
        '<dt>Gigs played</dt><dd>' + state.stats.gigsPlayed + '</dd>' +
        '<dt>Best result</dt><dd>' + (state.stats.bestResult ? state.stats.bestResult.charAt(0).toUpperCase() + state.stats.bestResult.slice(1) : '-') + '</dd>' +
        '<dt>Biggest crowd</dt><dd>' + state.stats.biggestCrowd + '</dd>' +
      '</dl>' +
      '</div>';
  }
};
