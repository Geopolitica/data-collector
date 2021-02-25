const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Twit = require("twit");
const cron = require("node-cron");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;
const router = express.Router();

const getData = require("./getData");
const testRequest = require("./testRequest");

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
  res.render("index", { title: "Geopolitica", source: source });
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

// Query setup
const params = {
  q: `from:${source} -is:retweet lang:en`,
  count: 10, //10,
  tweet_mode: "extended",
};

const setFrequency = 15;

// Inital Request
T.get("search/tweets", params, getData);
console.log(`🔎 Checking for tweets every ${setFrequency} minutes \n`);

// Subsequent requests
cron.schedule(`*/${setFrequency} * * * *`, function () {
  T.get("search/tweets", params, getData);
  console.log(`🔎 Checking for tweets every ${setFrequency} minutes \n`);
});
