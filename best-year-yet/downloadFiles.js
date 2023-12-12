const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");

// Download file function, as defined in earlier example
async function downloadFile(auth, file, dest) {
  const filePath = audioPathForFile(file);
  if (fs.existsSync(filePath)) {
    console.log(`File with ID ${file.id} already exists on disk.`);
    return filePath;
  }

  const drive = google.drive({ version: "v3", auth });
  const response = await drive.files.get(
    { fileId: file.id, alt: "media" },
    { responseType: "stream" },
  );

  const destStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    response.data
      .on("end", () => {
        console.log(`Downloaded file with ID: ${file}`);
        resolve(filePath);
      })
      .on("error", (err) => {
        console.error("Error downloading file.");
        reject(err);
      })
      .pipe(destStream);
  });
}

// List all files within the folder and download them
async function downloadAllFilesInFolder({ auth, folderId }) {
  const drive = google.drive({ version: "v3", auth });
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files/*",
      orderBy: "createdTime",
    });

    const files = response.data.files;
    if (files.length === 0) {
      console.log("No files found.");
      return;
    }

    // Iterate over each file and download it
    for (const file of files) {
      await downloadFile(auth, file);
    }

    console.log("All files have been downloaded.");
    return files;
  } catch (error) {
    console.error("The API returned an error: " + error);
  }
}

function audioPathForFile(file) {
  return path.join(__dirname, "./audios", file.id);
}

async function authenticateGoogleDrive() {
  return await authenticate({
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
}

// Authenticate and call the downloadAllFilesInFolder function
// Replace folderId and destinationFolder with your folder ID and destination path
module.exports = {
  downloadAllFilesInFolder,
  authenticateGoogleDrive,
  audioPathForFile,
};
