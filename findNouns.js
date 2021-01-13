var WordPOS = require("wordpos"),
  wordpos = new WordPOS();
const countryDetector = require("country-in-text-detector");
// const str = `US House of Representatives gets ready to vote on whether to impeach President Trump over last week's deadly attack on Congress

// For the latest ⬇️`;

// (async function () {
//   var result = await wordpos.getNouns(str);
//   console.log(result);
// // But the best part is, we can just keep awaiting different stuff, without ugly .then()s
// var somethingElse = await getSomethingElse()
// var moreThings = await getMoreThings()
// })();

// console.log(test);
// // [ 'little', 'angry', 'frightened' ]

// wordpos.isAdjective("awesome", function (result) {
//   console.log(result);
// });
// // true 'awesome'

const str = `something something Germany Syria`;

// function findCountries(data) {
//   console.log(data);
//   let countriesFound = countryDetector.detect(data);
//   let countryName = countriesFound.name;
//   let numMatches = countriesFound.matches.length;
//   return { countryName, numMatches };

// for (let i = 0; i < countriesFound.length; i++) {
//   let countryName = countriesFound[i].name;
//   let numMatches = countriesFound[i].matches.length;
//   return { countryName, numMatches };
// }
// }

const findCountry = function (text) {
  const test = countryDetector.detect(text);
  let countriesFound = [];
  for (let i = 0; i < test.length; i++) {
    countriesFound.push(test[i].name);
  }
  return countriesFound;
};

// findCountry();
console.log(findCountry(str));

// const test = countryDetector.detect("something something Germany Syria");
// console.log(test);
// console.log());
