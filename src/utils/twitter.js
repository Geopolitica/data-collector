const countryDetector = require("./../country-in-text-detector");

function removeLink(str, regex) {
  let cleanedString = str.replace(regex, "").trim();
  return cleanedString;
}

function extractLink(str, regex) {
  let link = str.match(regex, "");
  if (link) {
    return link.toString();
  }
}

function extractHashtags(str, regex) {
  let hashtags = str.match(regex, "");
  if (hashtags) {
    hashtags.forEach((hashtag) => hashtag.trim());
    return hashtags;
  }
}

function findCountries(data) {
  const countries = countryDetector.detect(data);
  let countryNames = new Set(); // [];
  let countryCodes = new Set(); // [];
  for (let i = 0; i < countries.length; i++) {
    if (countries[i]["iso3166_alpha2"].startsWith("US-")) {
      countryNames.add(countries[i].name);
      countryCodes.add(countries[i].iso3166_alpha3);
    } else if (countries[i].type === "city") {
      countryNames.add(countries[i].countryName); //.countryName);
      countryCodes.add(countries[i].iso3166_alpha3);
    } else if (countries[i].type === "country") {
      countryNames.add(countries[i].name); //.name);
      countryCodes.add(countries[i].iso3166_alpha3);
    }
  }
  const countryObj = {
    countryNames: [...countryNames],
    countryCodes: [...countryCodes],
  };
  return countryObj;
}

function calculateIPM(created_at, last_updated, total_interactions) {
  const minutesPassed = Math.abs(created_at - last_updated) / 60000;
  return total_interactions / minutesPassed;
}

module.exports = {
  removeLink,
  extractLink,
  extractHashtags,
  findCountries,
  calculateIPM,
};
