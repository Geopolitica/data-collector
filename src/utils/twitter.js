const countryDetector = require("./../country-in-text-detector");

const removeLink = function (str, regex) {
  let cleanedString = str.replace(regex, "").trim();
  return cleanedString;
};

const extractLink = function (str, regex) {
  let link = str.match(regex, "");
  if (link) {
    return link.toString();
  }
};

const extractHashtags = function (str, regex) {
  let hashtags = str.match(regex, "");
  if (hashtags) {
    hashtags.forEach((hashtag) => hashtag.trim());
    return hashtags;
  }
};

function findCountries(data) {
  const countries = countryDetector.detect(data);
  let countriesFound = [];
  for (let i = 0; i < countries.length; i++) {
    countriesFound.push(countries[i].name);
  }
  return countriesFound;
}

const calculateIPM = function (created_at, last_updated, total_interactions) {
  const minutesPassed = Math.abs(created_at - last_updated) / 60000;
  return total_interactions / minutesPassed;
};

module.exports = {
  removeLink,
  extractLink,
  extractHashtags,
  findCountries,
  calculateIPM,
};
// exports.removeLink = removeLink
