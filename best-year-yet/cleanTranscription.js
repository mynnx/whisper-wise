const OpenAI = require("openai");
const fs = require("fs");
const { transcriptionPathForFile } = require("./transcribe");
const config = require("./config.json");

function cleanTranscriptionPathForFile(file) {
  // Return the transcription path
  return `transcriptionsCleaned/${file.id}.txt`;
}

async function cleanTranscription(file) {
  const openai = new OpenAI();

  // Check if the transcription file already exists and load it from disk to save API calls
  const cleanTranscriptionPath = cleanTranscriptionPathForFile(file);
  if (fs.existsSync(cleanTranscriptionPath)) {
    console.log(
      `Cleaned transcription for file with ID: ${file.id} already exists on disk.`,
    );
    return fs.readFileSync(cleanTranscriptionPath, "utf8");
  }

  // Load the transcription data into memory
  const transcriptionData = fs.readFileSync(
    transcriptionPathForFile(file),
    "utf8",
  );

  console.log("Cleaning transcription for file with ID: " + file.id);
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
        You are a helpful assistant that helps clean up audio transcriptions.  You
        are given a transcription of a journal entry.  You need to clean up the
        transcription so that it is more readable and grammatically correct.  You may use Markdown
        to format the text, but do not use level-1 headings.  You may not change the
        meaning of the text.  Do not change the language of the text much.
      `,
      },
      {
        role: "user",
        content: `
      The next message will contain the transcription of a journal entry.  You may encounter some errors
      in the transcription.  Please correct them to make the transcription more readable and grammatically correct.
      
      You may encounter some words very similar to the following special words.  When you see them misspelled in the
      transcript, please correct the spelling.  
        ${config.specialWords.join("\n")}
      Respond only with the updated transcription.
      `,
      },
      {
        role: "user",
        content: transcriptionData,
      },
    ],
    model: "gpt-4-1106-preview",
  });

  // Save the transcription to disk
  const cleanedTranscription = response.choices[0].message.content;
  fs.writeFileSync(cleanTranscriptionPath, cleanedTranscription);
  console.log(
    "Cleaned transcription for file with ID: " + file.id + " finished",
  );

  // Return the transcription
  return cleanedTranscription;
}

module.exports = { cleanTranscription };
