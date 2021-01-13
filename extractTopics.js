const natural = require("natural");
const tokenizer = new natural.WordTokenizer();

const text =
  "US greenhouse gas emissions tumbled below their 1990 level last year, because of Covid-19 shutdowns";
// const tokenized = tokenizer.tokenize(text);

const stopwords = ["below", "their", "because", "of"];

const extractTopics = function (text) {
  const tokenized = tokenizer.tokenize(text);
  let topics = [];

  for (let i = 0; i < tokenized.length; i++) {
    if (!stopwords.includes(tokenized[i])) {
      topics.push(tokenized[i]);
    }
  }
  return topics;
};

console.log(extractTopics(text));
