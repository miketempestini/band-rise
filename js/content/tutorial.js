// tutorial.js
// The tip cards shown on the first few days of a new career. Fixed data, never saved.
//   day      which day of the career it shows on (0 = the first Monday)
//   target   which part of the screen it points at (the element with data-tour="...")

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.tutorial = [
  {
    id: 'topbar', day: 0, target: 'topbar', title: 'Your life at a glance',
    text: 'The bar at the top shows your cash, energy, morale, reputation, the date, and when rent is due. Rent is $' + Game.balance.housing.starter.weeklyCost + ' every Sunday night.'
  },
  {
    id: 'blocks', day: 0, target: 'blocks', title: 'Three blocks a day',
    text: 'Weekday mornings and afternoons are your day job. Click a free block to plan something: Practice, Write, Network, or Rest. Empty blocks count as rest.'
  },
  {
    id: 'inbox', day: 1, target: 'inbox', title: 'Open mics and your inbox',
    text: 'Tuesdays and Thursdays have open mics: plan one in the Evening to play your first set. Later, replies from venues land in your Inbox.'
  },
  {
    id: 'endDay', day: 2, target: 'endDay', title: 'End the day',
    text: 'When your plan looks good, click End Day. You\'ll see what happened, and the next day begins.'
  },
  {
    id: 'calendar', day: 2, target: 'calendar', title: 'Plan ahead',
    text: 'The Calendar shows four weeks. Plan days ahead, take days off, and manage booked shows there.'
  }
];
