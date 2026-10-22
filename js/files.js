// files.js
// The list of every file the game loads, in order, and the version tag added to each one.
// index.html and tests.html both load their files from this list, so a new file only needs adding here.
//
// PUBLISHING: change `tag` before every publish (the save version, then the date and a letter). Browsers keep
// saved copies of files; a new tag makes them fetch every file fresh, so old and new files never get mixed.
// (This file itself is always fetched fresh: the pages add the time to its address.)
//
// The pages load these as classic <script> tags, written one after another, so they run in order and the game
// still works from a double-click (a file:// address, no server).

window.Game = window.Game || {};

Game.files = {

  tag: 'v23-2026-10-22c',   // Must start with "v" + the save version (balance.save.version): a test checks it

  css: 'styles.css',

  // The phone layout: mobile.css is only used on screens this narrow (every iPhone), so desktop never sees it.
  // Game.ui.mobile.isPhone() checks the same rule.
  mobileCss: 'mobile.css',
  phoneQuery: '(max-width: 700px)',

  // The game itself: numbers, randomness, content, the save, and every rule. Both pages load these.
  game: [
    'js/balance.js',
    'js/rng.js', 'js/util.js',
    'js/content/calendar.js', 'js/content/skills.js', 'js/content/instruments.js', 'js/content/cities.js', 'js/content/countries.js',
    'js/content/actions.js', 'js/content/names.js', 'js/content/venues.js', 'js/content/gigText.js',
    'js/content/people.js', 'js/content/events.js', 'js/content/milestones.js', 'js/content/tutorial.js',
    'js/content/studios.js', 'js/content/business.js', 'js/content/finance.js', 'js/content/art.js', 'js/content/scene.js', 'js/content/handbook.js',
    'js/state.js', 'js/save.js',
    'js/rules/money.js', 'js/rules/finances.js', 'js/rules/housing.js', 'js/rules/energy.js', 'js/rules/morale.js',
    'js/rules/skills.js', 'js/rules/audience.js', 'js/rules/songs.js', 'js/rules/setlist.js', 'js/rules/people.js', 'js/rules/gigs.js',
    'js/rules/job.js', 'js/rules/booking.js', 'js/rules/progress.js', 'js/rules/events.js', 'js/rules/recording.js',
    'js/rules/streaming.js', 'js/rules/scene.js', 'js/rules/merch.js', 'js/rules/offers.js', 'js/rules/sessionWork.js', 'js/rules/travel.js', 'js/rules/manager.js',
    'js/rules/tours.js', 'js/rules/label.js', 'js/rules/bigShows.js', 'js/rules/awards.js', 'js/rules/actions.js',
    'js/rules/planWeek.js', 'js/rules/career.js', 'js/rules/day.js', 'js/rules/debug.js'
  ],

  // The screens (draw only) and the app (Game.app: holds the state and runs a screen's actions).
  // The game page loads these; tests.html loads them too, for the test that opens every screen.
  screens: [
    'js/ui/helpers.js', 'js/ui/mobile.js', 'js/ui/setlistEditor.js', 'js/ui/topbar.js', 'js/ui/title.js', 'js/ui/newCareer.js', 'js/ui/chooseSkills.js',
    'js/ui/statsPanel.js', 'js/ui/actionPicker.js', 'js/ui/today.js', 'js/ui/dayResults.js', 'js/ui/songReveal.js',
    'js/ui/songs.js', 'js/ui/release.js', 'js/ui/gigResult.js', 'js/ui/people.js', 'js/ui/nameBand.js', 'js/ui/booking.js', 'js/ui/studio.js',
    'js/ui/inbox.js', 'js/ui/calendar.js', 'js/ui/careerCard.js', 'js/ui/career.js', 'js/ui/sliceEnd.js',
    'js/ui/skipSummary.js', 'js/ui/shop.js', 'js/ui/finances.js', 'js/ui/contract.js', 'js/ui/job.js', 'js/ui/quitJob.js',
    'js/ui/planWeek.js', 'js/ui/map.js', 'js/ui/manager.js', 'js/ui/weeklySummary.js', 'js/ui/settings.js',
    'js/ui/gameOver.js', 'js/ui/tourPoster.js', 'js/ui/tourWrapUp.js', 'js/ui/tourBuilder.js', 'js/ui/handbook.js', 'js/ui/guide.js', 'js/ui/debugPanel.js',
    'js/app/core.js', 'js/app/picker.js', 'js/app/booking.js', 'js/app/calendar.js', 'js/app/shop.js', 'js/app/job.js',
    'js/app/bigTime.js', 'js/app/planWeek.js', 'js/app/people.js', 'js/app/music.js', 'js/app/tourBuilder.js', 'js/app/today.js', 'js/app/guide.js'
  ],

  // Starts the game. The game page only, and always last.
  start: ['js/main.js'],

  // Writes the stylesheet link (in the page's head).
  writeCss: function () {
    document.write('<link rel="stylesheet" href="' + Game.files.css + '?v=' + Game.files.tag + '">');
    document.write('<link rel="stylesheet" media="' + Game.files.phoneQuery + '" href="' + Game.files.mobileCss + '?v=' + Game.files.tag + '">');
  },

  // Writes a <script> tag for each file in a list, in order.
  write: function (list) {
    list.forEach(function (src) {
      document.write('<script src="' + src + '?v=' + Game.files.tag + '"><\/script>');
    });
  }
};
