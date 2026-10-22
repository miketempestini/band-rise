// tutorial.js
// The tip cards shown on the first few days of a new career: short notes from Walt (the mentor in
// js/content/handbook.js) pointing at the real buttons. Fixed data, never saved.
//   day        which day of the career it shows on (0 = the first Monday)
//   target     which part of the screen it points at (the element with data-tour="...")
//   text       the note on a computer
//   phoneText  the note on a phone, where the buttons sit in different places (optional: text is used if missing)

window.Game = window.Game || {};
Game.content = Game.content || {};

(function () {
  var b = Game.balance;

  Game.content.tutorial = [
    {
      id: 'topbar', day: 0, target: 'topbar', title: 'Keep an eye on the top bar',
      text: 'Cash, energy, morale, reputation, the date, and when rent is due. Energy is today; morale is the long haul. Keep both up and ' +
        'everything goes better. Rent is $' + b.housing.starter.weeklyCost + ' every Sunday night.',
      phoneText: 'The bar at the top shows cash, energy, morale, and the date. Tap it for the rest. Energy is today; morale is the long haul. ' +
        'Rent is $' + b.housing.starter.weeklyCost + ' every Sunday night.'
    },
    {
      id: 'blocks', day: 0, target: 'blocks', title: 'Your evening is yours',
      text: 'The job takes weekday mornings and afternoons. Click the Evening block and pick something: Practice to sound better, Write to start ' +
        'an original, or Rest if you\'re running low. Empty blocks give back a little energy.',
      phoneText: 'The job takes weekday mornings and afternoons. Tap the Evening block and pick something: Practice to sound better, Write to start ' +
        'an original, or Rest if you\'re running low. Empty blocks give back a little energy.'
    },
    {
      id: 'inbox', day: 1, target: 'inbox', title: 'Tonight\'s open mic night',
      text: 'Tuesdays and Thursdays have open mics. Plan "Play the open mic" in the Evening and pick your two tightest songs. Later, replies from ' +
        'venues land in your Inbox.'
    },
    {
      id: 'endDay', day: 2, target: 'endDay', title: 'End the day',
      text: 'When the plan looks right, click End Day. The Previous day box sums up what happened (click it for the whole day). If energy ' +
        'is under ' + b.energy.tiredThreshold + ' before a show, Rest first: tired shows score lower.',
      phoneText: 'When the plan looks right, tap End Day. The Previous day box sums up what happened (tap it for the whole day). If energy ' +
        'is under ' + b.energy.tiredThreshold + ' before a show, Rest first: tired shows score lower.'
    },
    {
      id: 'calendar', day: 2, target: 'calendar', title: 'Plan ahead',
      text: 'The Calendar shows the weeks ahead. Plan days, book days off work, and set up your shows there. Forgot how something works? ' +
        'Settings → Guide has the whole story.',
      phoneText: 'The Calendar shows a week at a time. Plan days and set up your shows there. Forgot how something works? ' +
        'More → Settings → Guide has the whole story.'
    }
  ];
})();
