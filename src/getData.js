const stopwords = require("./data/stopwords.js").words;
const demonyms = require("./data/demonyms.js").demonyms;
const WordPOS = require("wordpos"),
  wordpos = new WordPOS();
const Tweet = require("./models/tweetModel.js");
const {
  removeLink,
  extractLink,
  extractHashtags,
  findCountries,
  calculateIPM,
} = require("./utils/twitter.js");

// Define Regex for twitter.js functions
const hyperlinkRegex = /(?:https?|ftp):\/\/[\n\S]+/g;
const hashtagRegex = /(^|\s)(#[a-z\d-]+)/gi;

module.exports = async function getData(err, data, response) {
  try {
    const tweetInfo = data.statuses;

    for (let i = 0; i < tweetInfo.length; i++) {
      const cleanText = removeLink(tweetInfo[i].full_text, hyperlinkRegex);
      const hashtags = extractHashtags(cleanText, hashtagRegex);
      const article_link = extractLink(tweetInfo[i].full_text, hyperlinkRegex);
      const nouns = await wordpos.getNouns(cleanText);
      const { countryNames, countryCodes } = findCountries(cleanText);
      const topics = [];
      for (const n of nouns) {
        if (
          !countryNames.includes(n) &&
          !demonyms.includes(n) &&
          !stopwords.includes(n)
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
        country_mentions: countryNames,
        country_codes: countryCodes,
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

      let doc = await Tweet.findOneAndUpdate(filter, update, opts).catch(
        (e) => {
          console.log(e);
        }
      );
      console.log(doc);
    }
  } catch (error) {
    console.log(error);
  }
};
