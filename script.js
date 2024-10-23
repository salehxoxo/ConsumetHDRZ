// script.js
const axios = require("axios");
const { load } = require("cheerio");

// Utility to decode data
const getData = (x) => {
  const v = {
    file3_separator: "//_//",
    bk0: "$$#!!@#!@##",
    bk1: "^^^!@##!!##",
    bk2: "####^!!##!@@",
    bk3: "@@@@@!##!^^^",
    bk4: "$$!!@$$@^!@#$$@",
  };
  let a = x.substr(2);
  for (let i = 4; i >= 0; i--) {
    if (v["bk" + i]) {
      a = a.replace(
        v.file3_separator +
          btoa(
            encodeURIComponent(v["bk" + i]).replace(
              /%([0-9A-F]{2})/g,
              (_, p1) => String.fromCharCode("0x" + p1)
            )
          ),
        ""
      );
    }
  }
  try {
    a = decodeURIComponent(
      atob(a)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    a = "";
  }
  return a.split(",").reduce((m, ele) => {
    const [key, value] = ele.split("]");
    m[key.replace("[", "")] = value;
    return m;
  }, {});
};

// Main function to handle API requests
const main = async (id, type = "movie", season, episode) => {
  const params =
    type !== "movie"
      ? {
          id,
          translator_id: 238,
          season,
          episode,
          action: "get_stream",
        }
      : {
          id,
          translator_id: 238,
          action: "get_movie",
        };

  const resp = (
    await axios.post(
      "https://hdrezka.me/ajax/get_cdn_series/?t=" + new Date().getTime(),
      new URLSearchParams(params).toString()
    )
  ).data;

  console.log(
    JSON.stringify({
      src: getData(resp.url),
      subtitle: resp.subtitle,
    })
  );
};

// Simulated function for get_id (can be adapted as needed)
const getId = async (q, year, type) => {
    const resp = await (
      await axios.get(
        "https://hdrezka.me/search/?do=search&subaction=search&q=" + q
      )
    ).data;
    const $ = load(resp);
    const id = $(".b-content__inline_item")
      .map((_, e) =>
        $(e)
          .find(".b-content__inline_item-link > div")
          .text()
          .split(",")
          .shift()
          .includes(year) && $(e).find(".entity").text() == type
          ? $(e).attr("data-id")
          : undefined
      )
      .get();
    console.log(id);
};

// Handle command-line arguments
const [,, func, ...args] = process.argv;

if (func === "main") {
  const [id, type, season, episode] = args;
  main(parseInt(id), type, parseInt(season), parseInt(episode));
} else if (func === "getId") {
  const [title, year, type] = args;
  getId(title, year, type);
} else {
  console.error("Invalid function name provided.");
}
