const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Twit = require("twit");
const cron = require("node-cron");
const path = require("path");
const countryDetector = require("country-in-text-detector");

const app = express();
const port = process.env.PORT || 5000;
const router = express.Router();

dotenv.config({ path: "./config.env" });

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

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => console.log("DB connection successful! 🎉"));

const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
});

const tweetSchema = new mongoose.Schema({
  vendor_id: Number,
  created_at: Date,
  text: String,
  user: String,
  retweet_count: Number,
  favourite_count: Number,
  last_updated_at: Date,
  country_mentions: Object,
});

const Tweet = mongoose.model("Tweet", tweetSchema);

const params = {
  q: `from:${source} -is:retweet lang:en`,
  count: 10,
  tweet_mode: "extended",
};

const getData = async (err, data, response) => {
  const tweetInfo = data.statuses;
  //console.log(tweetInfo);

  for (let i = 0; i < tweetInfo.length; i++) {
    const filter = { vendor_id: tweetInfo[i].id };
    const update = {
      vendor_id: tweetInfo[i].id,
      created_at: tweetInfo[i].created_at,
      text: tweetInfo[i].full_text,
      user: tweetInfo[i].user.name,
      retweet_count: tweetInfo[i].retweet_count,
      favourite_count: tweetInfo[i].favorite_count,
      last_updated_at: Date.now(),
    };
    const opts = {
      new: true,
      upsert: true,
    };

    let doc = await Tweet.findOneAndUpdate(filter, update, opts).catch((e) => {
      console.log(e);
    });
    console.log(doc.text);
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

const retrieveTweets = async function () {
  try {
    // Queries for tweets logged in the last 24 hours
    const query = {
      country_mentions: { $exists: false },
    };
    const result = await Tweet.find(query).sort({ _id: -1 }).lean(); //.limit(10)

    return result;
  } catch (error) {
    console.log(error);
  }
};

const addCountryMentions = async function (id, mentions) {
  try {
    // Locates tweet by ID and adds country mentions
    const record = await Tweet.findByIdAndUpdate(
      id,
      { country_mentions: mentions },
      function (err, result) {
        if (err) {
          console.log("😭");
        } else {
          console.log(`${id} 🌈`);
        }
      }
    );
    return record;
  } catch (error) {
    return error;
  }
};

function findCountries(data) {
  let countriesFound = countryDetector.detect(data);

  for (let i = 0; i < countriesFound.length; i++) {
    let countryName = countriesFound[i].name;
    let numMatches = countriesFound[i].matches.length;
    return { countryName, numMatches };
  }
}

function failureCallback(error) {
  console.log(error);
}

(async function () {
  retrieveTweets()
    .then(function (tweets) {
      for (i = 0; i < tweets.length; i++) {
        let mentions = findCountries(tweets[i].text);
        addCountryMentions(tweets[i]._id, mentions);
      }
    })
    .catch(failureCallback);
})();
