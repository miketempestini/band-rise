// calendar.js
// Fixed names for days and time blocks, used when showing dates on screen.

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.calendar = {
  // Day 0 of every week is Monday.
  dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],

  // Display names for the three blocks of the day.
  blockNames: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }
};
