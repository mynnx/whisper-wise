const fs = require("fs");

const withRetrievalFile = async (func) => {
  const dir = "retrieval";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const retrievalStream = fs.createWriteStream(`./${dir}/retrieval.md`);
  await func(retrievalStream);
  retrievalStream.end();
};

module.exports = { withRetrievalFile };
