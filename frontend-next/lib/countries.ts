/**
 * UN member/observer states, for the "add portfolios by country" checklist
 * on the committee page -- lets an organizer pick countries from a list
 * instead of typing each one from memory. Not tied to any conference/
 * committee data; purely a static reference list.
 *
 * Ordered by rough real-world geopolitical/economic weight rather than
 * alphabetically, so the countries an organizer is most likely to want
 * (P5, G7/G20, other states that dominate real UN agenda items) surface
 * first in the checklist instead of being buried under "A" countries.
 * This is inherently a judgment call, not an official ranking -- the tail
 * end (everything past the ~55 most commonly-seated countries) falls back
 * to alphabetical since ranking all ~190 states individually would be
 * arbitrary busywork with no real payoff.
 */
export const UN_COUNTRIES: string[] = [
  // P5 (UN Security Council permanent members)
  "United States of America", "United Kingdom", "France", "Russia", "China",

  // Rest of G7
  "Germany", "Japan", "Italy", "Canada", "India",

  // Rest of G20 / major regional powers
  "Brazil", "South Korea", "Australia", "Indonesia", "Mexico", "Saudi Arabia",
  "Turkey", "Argentina", "South Africa",

  // Frequently central to real UN/Security Council agenda items -- regional
  // powers, major economies, and states most often at the center of the
  // conflicts and crises MUN committees debate
  "Israel", "Iran", "Pakistan", "North Korea", "Ukraine", "Egypt", "Nigeria",
  "Poland", "Spain", "Netherlands", "Sweden", "Switzerland", "Norway",
  "United Arab Emirates", "Qatar", "Singapore", "New Zealand", "Vietnam",
  "Philippines", "Thailand", "Venezuela", "Colombia", "Chile", "Kenya",
  "Ethiopia", "Algeria", "Morocco", "Iraq", "Syria", "Afghanistan", "Libya",
  "Yemen", "Sudan", "South Sudan", "Somalia", "Myanmar", "Bangladesh",
  "Sri Lanka", "Cuba", "Belarus", "Kazakhstan", "Peru", "Nepal", "Jordan",
  "Lebanon", "Rwanda", "Ghana", "Senegal", "Tanzania", "Uganda",

  // Everything else, alphabetical
  "Albania", "Andorra", "Angola", "Antigua and Barbuda", "Armenia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Barbados", "Belgium", "Belize", "Benin",
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Central African Republic", "Chad", "Comoros", "Congo, Democratic Republic of the",
  "Congo, Republic of the", "Costa Rica", "Cote d'Ivoire", "Croatia", "Cyprus",
  "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Fiji",
  "Finland", "Gabon", "Gambia", "Georgia", "Greece", "Grenada", "Guatemala",
  "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
  "Iceland", "Ireland", "Jamaica", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
  "Latvia", "Lesotho", "Liberia", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru",
  "Nicaragua", "Niger", "North Macedonia", "Oman", "Palau", "Palestine",
  "Panama", "Papua New Guinea", "Paraguay", "Portugal", "Romania",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Serbia", "Seychelles",
  "Sierra Leone", "Slovakia", "Slovenia", "Solomon Islands", "Suriname",
  "Tajikistan", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkmenistan", "Tuvalu", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Zambia", "Zimbabwe",
];
