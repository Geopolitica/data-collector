// Useful functions for future use keeping DB up-to-date
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

function failureCallback(error) {
  console.log(error);
}

const extractTopics = function (text) {
  const tokenized = tokenizer.tokenize(text);
  const stopwords = defaultStopwords;
  let topics = [];

  for (let i = 0; i < tokenized.length; i++) {
    if (!stopwords.includes(tokenized[i])) {
      topics.push(tokenized[i].trim());
    }
  }
  return topics;
};

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
