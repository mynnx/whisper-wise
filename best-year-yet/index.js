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

'use strict';

const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');

const drive = google.drive('v3');

async function runSample(query) {
  // Obtain user credentials to use for the request
  const auth = await authenticate({
    keyfilePath: path.join(__dirname, './oauth2.keys.json'),
    scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.photos.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
  });
  google.options({auth});
  
  const folderId = '1PwPeIRAqPLlumJJmGRgDD4S1OjqoJbzy';
  
  // List files in the folder
  drive.files.list({
  })
  drive.files.list({
    q: `'${folderId}' in parents`,
    fields: 'files(id, name, mimeType)',
  }).then(response => {
    const files = response.data.files;
  
    // Download metadata and files
    for (const file of files) {
      // Download metadata
      drive.files.get({
        fileId: file.id,
        // fields: 'modifiedTime, fileSize, mimeType',
      }).then(metadataResponse => {
        const metadata = metadataResponse.data;
        console.log(`File metadata: ${JSON.stringify(metadata)}`);
  
        // Download file content
        drive.files.get({
          fileId: file.id,
          alt: 'media',
        }).then(fileResponse => {
          // Save file content to local storage
          const fileContent = fileResponse.data;
          fs.writeFileSync(`./${file.name}`, fileContent);
          console.log(`File downloaded: ${file.name}`);
        });
      });
    }
  });
  
}

if (module === require.main) {
  runSample().catch(console.error);
}
module.exports = runSample;