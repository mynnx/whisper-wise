"use strict";

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");

const drive = google.drive("v3");

async function getFiles(query) {
  // Obtain user credentials to use for the request
  const auth = await authenticate({
    keyfilePath: path.join(__dirname, "./oauth2.keys.json"),
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.appdata",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive.photos.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
  google.options({ auth });

  const folderId = "1PwPeIRAqPLlumJJmGRgDD4S1OjqoJbzy";

  // List files in the folder
  drive.files
    .list({
      q: `'${folderId}' in parents`,
      // fields: "files(id, name, mimeType)",
    })
    .then((response) => {
      const files = response.data.files;

      // Download metadata and files
      for (const file of files) {
        // Download metadata
        drive.files
          .get({
            fileId: file.id,
            // fields: 'modifiedTime, fileSize, mimeType',
          })
          .then((metadataResponse) => {
            const metadata = metadataResponse.data;
            console.log(`File metadata: ${JSON.stringify(metadata)}`);

            // Download file content
            drive.files
              .get({
                fileId: file.id,
                alt: "media",
                responseType: "arraybuffer", // Set the response type to 'arraybuffer'
              })
              .then(async (fileResponse) => {
                await writeBlobToDisk({
                  blob: fileResponse.data,
                  filePath: path.join("audios", file.name),
                });
                console.log(`File downloaded: ${file.name}`);
              });
          });
      }
    });
}

async function writeBlobToDisk({ blob, filePath }) {
  // Convert the Blob to a Buffer
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use 'fs.writeFileSync' to write the Buffer to disk
  fs.writeFileSync(filePath, buffer);
}

module.exports = getFiles;
