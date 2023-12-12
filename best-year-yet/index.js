// Copyright 2016 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

require("dotenv").config();
const {
  authenticateGoogleDrive,
  downloadAllFilesInFolder,
} = require("./downloadFiles");
const { withRetrievalFile } = require("./retrievalFile");
const { getTranscription } = require("./transcribe");
const { cleanTranscription } = require("./cleanTranscription");

if (module === require.main) {
  authenticateGoogleDrive().then(async (auth) => {
    const files = await downloadAllFilesInFolder({
      auth,
      folderId: "1PwPeIRAqPLlumJJmGRgDD4S1OjqoJbzy",
    });
    withRetrievalFile(async (retrievalStream) => {
      await Promise.all(files.map(getTranscription));
      const cleanedTranscriptions = await Promise.all(
        files.map(cleanTranscription),
      );
      let currentMonth = null;
      cleanedTranscriptions.forEach((transcription, index) => {
        const createdTime = new Date(files[index].createdTime);
        const month = createdTime.toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
          month: "long",
        });

        if (month !== currentMonth) {
          retrievalStream.write(`# ${month}\n\n`);
          currentMonth = month;
        }

        const formattedTime = createdTime.toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        retrievalStream.write(`## ${formattedTime}\n\n${transcription}\n\n`);
      });
    });
  });
}
