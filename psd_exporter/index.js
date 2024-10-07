const { app, constants } = require('photoshop');
const { storage } = require('uxp');

// Helper function to execute photoshop as modal.
function executePhotoshopModal(callback, commandName) {
  return require('photoshop').core.executeAsModal(callback, { commandName });
}

//
// Flatten groups functionality
//
let mergeGroups = [];
const SWIPE = '_SWIPE';
const MERGE = '_MERGE';

function findLayers(layers) {
  for (const layer of layers) {
    if (layer.layers) findLayers(layer.layers);
    let layer_name = layer.name;
    console.log(constants);
    if (layer.kind !== constants.LayerKind.GROUP) continue;
    if (layer_name.endsWith(SWIPE) || layer_name.endsWith(MERGE)) {
      mergeGroups.push(layer);
    }
  }
}

function mergeLayers(mergeLayers) {
  executePhotoshopModal(() => {
    for (const layer of mergeLayers) {
      if (layer.name.endsWith(SWIPE)) {
        layer.name = layer.name.replace(SWIPE, '');
      } else if (layer.name.endsWith(MERGE)) {
        layer.name = layer.name.replace(MERGE, '');
      }
      layer.merge();
    }
  }, 'merge layers');
}

function flattenGroupsMain() {
  const documentLayers = app.activeDocument.layers;

  findLayers(documentLayers);

  if (mergeGroups.length === 0) {
    console.log('No layers to merge');
    return;
  }

  mergeLayers(mergeGroups);
  mergeGroups = [];
}

//
// Resize and Export document as PSD functionality
//
async function resizeDocument() {
  await executePhotoshopModal(() => {
    app.activeDocument.resizeImage(1024, 1267);
  }, 'resize doc');
}

async function saveFile() {
  const fileName = app.activeDocument.name;
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  let entry = await storage.localFileSystem.getFileForSaving(`${fileNameWithoutExt}_EXPORT.psd`);
  await executePhotoshopModal(() => {
    app.activeDocument.saveAs.psd(entry);
  }, 'save psd');
}

async function exportFile() {
  await resizeDocument();
  await saveFile();
}

//
// Event listener calls
//

document.getElementById('flattenGroups').addEventListener('click', flattenGroupsMain);
document.getElementById('exportFile').addEventListener('click', exportFile);
