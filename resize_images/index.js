const { app, core, action } = require('photoshop');
const { storage } = require('uxp');

const fs = storage.localFileSystem;

// global variables

let sourceFolder;
let destinationFolder;
let fileList = [];

// actual functions

async function copyPixels() {
  try {
    await action.batchPlay(
      [
        {
          _obj: 'copyEvent',
        },
      ],
      {}
    );
  } catch (error) {
    console.log(error);
  }
}

async function selectFoldersAndRetrieveFiles() {
  sourceFolder = await fs.getFolder();
  destinationFolder = await fs.getFolder();

  fileList = await getFilesRecursively(sourceFolder, sourceFolder);
  console.log('File list obtained', fileList);
}

async function getFilesRecursively(folder, rootFolder) {
  let localFileList = [];
  const entries = await folder.getEntries();

  for (const entry of entries) {
    if (entry.isFolder) {
      localFileList = localFileList.concat(await getFilesRecursively(entry, rootFolder));
    } else if (entry.isFile && entry.name.match(/\.png$/i)) {
      localFileList.push({
        file: entry,
        relativePath: entry.nativePath.replace(rootFolder.nativePath, ''),
      });
    }
  }

  return localFileList;
}

async function checkFolderExists(parentFolder, folderName) {
  const entries = await parentFolder.getEntries();

  const folderExists = entries.find((item) => item.name === folderName);

  if (folderExists) {
    return true;
  } else {
    return false;
  }
}

async function setClippingLayer(layerid) {
  const command = { _obj: 'groupEvent', _target: [{ _ref: 'layer', _id: layerid }] };
  const result = await action.batchPlay([command], {});
}

async function processImages() {
  if (!sourceFolder || !destinationFolder) {
    alert('No folders selected. Process cancelled.');
    return;
  }
  if (fileList.length === 0) {
    alert('No files to process. Please select folders first');
  } else {
    for (const { file, relativePath } of fileList) {
      try {
        // Create the necessary folders in the destination path
        const destinationFilePath = path.join(destinationFolder.nativePath, relativePath);
        console.log('This is the destination file path:', destinationFilePath);

        const destinationPath = path.dirname(destinationFilePath);
        console.log('This is the path:', destinationPath);

        const folderNameArray = destinationPath.split(path.sep);
        const lastFolderName = folderNameArray[folderNameArray.length - 1];
        console.log('This is the folder name:', lastFolderName);

        if (!(await checkFolderExists(destinationFolder, lastFolderName))) {
          await destinationFolder.createFolder(lastFolderName);
        }

        if (!file.isFile) {
          console.log('Error: File not supported or selected');
          return;
        }

        await core.executeAsModal(async () => {
          const doc = await app.open(file);
          console.log(`Opened file: ${file.name}`);

          await doc.resizeImage(360, 430);
          console.log(`Resized file: ${file.name}`);

          await doc.selection.selectAll();
          await copyPixels();
          await doc.closeWithoutSaving();
          console.log(`Copied content from temp file: ${file.name}`);

          const cardTemplate = app.documents[0];
          await cardTemplate.paste();
          const importedLayer = cardTemplate.layers.getByName('Layer 1');
          await setClippingLayer(importedLayer.id);
          console.log('Card clipped to template');

          const exportOptions = {
            method: 'PNGMethod',
            transparency: true,
            interlaced: false,
          };

          const cardIndexExtension = file.name.slice(-7);
          console.log(cardIndexExtension);

          // OLD
          //const directoryPath = relativePath.substring(0, relativePath.lastIndexOf('/') + 1);
          //const saveFile = await fs.getFileForSaving(destinationFolder.nativePath + directoryPath + lastFolderName.name + cardIndexExtension);
          // OLD

          // NOT WORKING CURRENTLY //
          const fileName = lastFolderName.name + cardIndexExtension;
          const pathSymbol = Symbol(destinationPath);
          const saveFile = await fs.getFileForSaving(fileName, pathSymbol);

          await cardTemplate.saveAs.png(saveFile, exportOptions);
          console.log(`Exported file to: ${saveFile.nativePath}`);
          // NOT WORKING CURRENTLY //
          await importedLayer.delete();
          console.log(`Removed layer`);
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}: ${error}`);
      }
    }
    alert('Processing complete!');
  }
}

// Button functions

document.getElementById('getImagesButton').addEventListener('click', selectFoldersAndRetrieveFiles);
document.getElementById('processImagesButton').addEventListener('click', processImages);
