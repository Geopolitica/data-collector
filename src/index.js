const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Twit = require("twit");
const cron = require("node-cron");
const path = require("path");
const countryDetector = require("country-in-text-detector");
const notTopics = require("./stopwords.js").words;
const demonyms = require("./demonyms.js").demonyms;
var WordPOS = require("wordpos"),
  wordpos = new WordPOS();

const app = express();
const port = process.env.PORT || 5000;
const router = express.Router();

dotenv.config({ path: `${__dirname}/../config.env` });

// Define Twitter handle of source here
const source = "BBCWorld";

app
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "public/views"))
  .set("view engine", "pug")
  .get("/", (req, res) => res.render("index", { source: `@${source}` }))
  .listen(port, () => console.log(`Listening on port ${port}`));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Geopolitica", source: "BBC World" });
});

// Database Setup

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log("DB connection successful! 🎉"));

// Twitter setup
const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
});

// Mongo Model definition
const tweetSchema = new mongoose.Schema({
  vendor_id: Number,
  created_at: Date,
  text: String,
  user: String,
  retweet_count: Number,
  favourite_count: Number,
  last_updated_at: Date,
  country_mentions: Object,
  topics: Array,
  hashtags: Array,
  total_interactions: Number,
  article_link: String,
  interactions_per_minute: Number,
});

const Tweet = mongoose.model("Tweet", tweetSchema);

// Query setup

const params = {
  q: `from:${source} -is:retweet lang:en`,
  count: 1, // 10,
  tweet_mode: "extended",
};
// Define Regex

const hyperlinkRegex = /(?:https?|ftp):\/\/[\n\S]+/g;
const hashtagRegex = /(^|\s)(#[a-z\d-]+)/gi;

// Functions
// TODO: Further refactor extraction functions
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
  let hashtags = str.match(hashtagRegex, "");
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

const getData = async (err, data, response) => {
  const tweetInfo = data.statuses;

  for (let i = 0; i < tweetInfo.length; i++) {
    const cleanText = removeLink(tweetInfo[i].full_text, hyperlinkRegex);
    const hashtags = extractHashtags(cleanText, hashtagRegex);
    const article_link = extractLink(tweetInfo[i].full_text, hyperlinkRegex);
    const nouns = await wordpos.getNouns(cleanText);
    const country_mentions = findCountries(cleanText);
    const topics = [];
    for (const n of nouns) {
      if (
        !country_mentions.includes(n) &&
        !demonyms.includes(n) &&
        !notTopics.includes(n)
      ) {
        topics.push(n);
      }
    }
    const total_interactions =
      tweetInfo[i].retweet_count + tweetInfo[i].favorite_count;

    const interactions_per_minute = calculateIPM(
      new Date(tweetInfo[i].created_at).getTime(),
      Date.now(),
      total_interactions
    );

    const filter = { vendor_id: tweetInfo[i].id };
    const update = {
      vendor_id: tweetInfo[i].id,
      created_at: tweetInfo[i].created_at,
      text: cleanText,
      user: tweetInfo[i].user.name,
      retweet_count: tweetInfo[i].retweet_count,
      favourite_count: tweetInfo[i].favorite_count,
      last_updated_at: Date.now(),
      country_mentions,
      topics,
      hashtags,
      total_interactions,
      article_link,
      interactions_per_minute,
    };
    const opts = {
      new: true,
      upsert: true,
    };

    let doc = await Tweet.findOneAndUpdate(filter, update, opts).catch((e) => {
      console.log(e);
    });
    console.log(doc);
  }
};

// Inital Request
T.get("search/tweets", params, getData);
console.log("🔎 Checking for tweets every 15 minutes \n");

// Subsequent requests
cron.schedule("*/30 * * * *", function () {
  T.get("search/tweets", params, getData);
  console.log("🔎 Checking for tweets every 15 minutes \n");
});
