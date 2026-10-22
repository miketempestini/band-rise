// labels.js
// The record labels that can offer you a deal: names, tiers, personalities, and a line about each. Fixed data, never
// saved. Their numbers (term ranges by tier, and how each personality shapes them) are in balance.label.
//   tier         'indie' | 'mid' | 'major' | 'shark'
//   personality  'friendly' | 'prestige' | 'pincher' | 'hype' | 'balanced' | 'corporate' | 'predatory'
//   color        the label's ink color on the contract (a logo stand-in)

window.Game = window.Game || {};
Game.content = Game.content || {};

Game.content.labels = {
  porchlight:  { id: 'porchlight', name: 'Porchlight Records', tier: 'indie', personality: 'friendly', color: '#b5651d',
                 blurb: 'Two friends in a converted garage. Small money, a fair split, and they never touch your masters.' },
  lanternHill: { id: 'lanternHill', name: 'Lantern Hill', tier: 'indie', personality: 'prestige', color: '#3d5a80',
                 blurb: 'Critics love their roster. They only put out records they believe in.' },
  cassetteClub: { id: 'cassetteClub', name: 'Cassette Club', tier: 'indie', personality: 'pincher', color: '#6b705c',
                 blurb: 'A shoestring label that counts every penny, mostly yours.' },
  staticBloom: { id: 'staticBloom', name: 'Static Bloom', tier: 'indie', personality: 'hype', color: '#c9184a',
                 blurb: 'Loud, fast, and everywhere online. They want records quickly and a piece of your merch table.' },
  northbound:  { id: 'northbound', name: 'Northbound Records', tier: 'mid', personality: 'balanced', color: '#1d3557',
                 blurb: 'A steady mid-size label with a good reputation for fair deals.' },
  riverbend:   { id: 'riverbend', name: 'Riverbend Music Group', tier: 'mid', personality: 'pincher', color: '#386641',
                 blurb: 'Solid distribution, slow to spend, and they charge back everything.' },
  neonHarbor:  { id: 'neonHarbor', name: 'Neon Harbor', tier: 'mid', personality: 'hype', color: '#7b2cbf',
                 blurb: 'Big release-week pushes and a cut of everything you do.' },
  monolith:    { id: 'monolith', name: 'Monolith Music', tier: 'major', personality: 'corporate', color: '#212529',
                 blurb: 'The biggest machine in the business. Enormous reach, and they own what you make.' },
  crownAnchor: { id: 'crownAnchor', name: 'Crown & Anchor', tier: 'major', personality: 'prestige', color: '#9a031e',
                 blurb: 'A storied major with an eye for quality. Their artists win awards.' },
  sunsetGlobal: { id: 'sunsetGlobal', name: 'Sunset Global', tier: 'major', personality: 'hype', color: '#e85d04',
                 blurb: 'Massive marketing, massive expectations, and a heavy cut of your shows.' },
  goldtooth:   { id: 'goldtooth', name: 'Goldtooth Entertainment', tier: 'shark', personality: 'predatory', color: '#a68a00',
                 blurb: 'Flashy offices and a dazzling check. Read the fine print.' },
  fastLane:    { id: 'fastLane', name: 'Fast Lane Artist Group', tier: 'shark', personality: 'predatory', color: '#495057',
                 blurb: 'They find artists when times are hard, and they don\'t let go.' }
};

// Plain names for the tiers and personalities, shown on offers and contracts.
Game.content.labelTiers = { indie: 'Indie label', mid: 'Mid-size label', major: 'Major label', shark: 'Label' };
Game.content.labelPersonalities = {
  friendly: 'Artist-friendly', prestige: 'Prestige', pincher: 'Penny-pincher', hype: 'Hype machine',
  balanced: 'Balanced', corporate: 'Corporate', predatory: 'Big promises'
};
