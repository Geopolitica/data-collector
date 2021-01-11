// Useful functions for future use keeping DB up-to-date

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
