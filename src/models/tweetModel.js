const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
  vendor_id: Number,
  created_at: Date,
  text: String,
  user: String,
  retweet_count: Number,
  favourite_count: Number,
  last_updated_at: Date,
  country_mentions: Object,
  country_codes: Object,
  topics: Array,
  hashtags: Array,
  total_interactions: Number,
  article_link: String,
  interactions_per_minute: Number,
});

const Tweet = mongoose.model("Tweet", tweetSchema);
module.exports = Tweet;
