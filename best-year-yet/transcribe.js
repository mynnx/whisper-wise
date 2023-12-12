// Import the necessary modules
const fs = require("fs");
const OpenAI = require("openai");
const Bottleneck = require("bottleneck");
const { audioPathForFile } = require("./downloadFiles");

// Create an instance of the OpenAI API
const openai = new OpenAI();
const PROMPT = `Transcribe the following audio file, which is an audio journal entry.`;

const limiter = new Bottleneck({
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 60 * 1000,

  // also use maxConcurrent and/or minTime for safety
  maxConcurrent: 10,
});

async function getTranscription(file) {
  const transcriptionPath = transcriptionPathForFile(file);

  // Check if the transcription file already exists
  if (fs.existsSync(transcriptionPath)) {
    // Read the transcription from disk
    const transcription = fs.readFileSync(transcriptionPath, "utf8");
    return transcription;
  }

  // Create a read stream of the audio file
  const audioPath = audioPathForFile(file);
  const audioStream = fs.createReadStream(audioPath);

  // Call the OpenAI API to get the transcription with rate-limiting
  const transcription = await limiter.schedule(async () => {
    console.log("Transcribing file with ID: " + file.id);
    try {
      const transc = await openai.audio.transcriptions.create({
        file: await OpenAI.toFile(audioStream, file.name),
        model: "whisper-1",
        language: "en",
        prompt: PROMPT,
        response_format: "text",
        temperature: 0.2,
      });
      // TODO check the file for punctuation, capital letters, etc. and retry
      console.log("Transcription for file with ID: " + file.id + " finished");
      return transc;
    } catch (error) {
      console.error("Error transcribing file with ID: " + file.id, { error });
      return null;
    }
  });

  // Save the transcription to disk
  fs.writeFileSync(transcriptionPath, transcription);

  // Return the transcription
  return transcription;
}

function transcriptionPathForFile(file) {
  // Return the transcription path
  return `transcriptions/${file.id}.txt`;
}

module.exports = { getTranscription, transcriptionPathForFile };
