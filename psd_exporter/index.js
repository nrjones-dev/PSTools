const { app, constants, core } = require('photoshop');
const { storage } = require('uxp');

// Helper function to execute photoshop as modal.
function executePhotoshopModal(callback, commandName) {
  return core.executeAsModal(callback, { commandName });
}

// Suffix name constants
const SWIPE = '_SWIPE';
const MERGE = '_MERGE';
const RESOLUTION = [1024, 1267];

// find all relevant layers that are of kind GROUP and ends with SWIPE or MERGE constants
function findLayers(layers) {
  const groupsToMerge = [];
  layers.forEach((layer) => {
    if (layer.layers) {
      const foundLayers = findLayers(layer.layers);
      groupsToMerge.push(...foundLayers);
    }
    if (layer.kind === constants.LayerKind.GROUP && (layer.name.endsWith(SWIPE) || layer.name.endsWith(MERGE))) {
      groupsToMerge.push(layer);
    }
  });
  return groupsToMerge;
}

// Remove suffix from groups that will be merged, and merges them into a single layer
function mergeGroupLayers(groupsToMerge) {
  executePhotoshopModal(() => {
    groupsToMerge.forEach((layer) => {
      layer.name = layer.name.replace(SWIPE, '').replace(MERGE, '');
      layer.merge();
    });
  }, 'merging layers');
}

// Main function that calls findLayers and mergeGroupLayers on button press
function flattenGroupsMain() {
  const documentLayers = app.activeDocument.layers;
  const groupsToMerge = findLayers(documentLayers);

  if (groupsToMerge.length === 0) {
    window.alert('No layers to merge');
    return;
  }
  mergeGroupLayers(groupsToMerge);
}

// Resize and Export document as PSD functionality
async function resizeDocument() {
  await executePhotoshopModal(() => {
    app.activeDocument.resizeImage(...RESOLUTION);
  }, 'resizing document');
}

async function saveFile() {
  const fileNameWithoutExt = app.activeDocument.name.replace(/\.[^/.]+$/, '');
  const entry = await storage.localFileSystem.getFileForSaving(`${fileNameWithoutExt}_EXPORT.psd`);
  await executePhotoshopModal(() => {
    app.activeDocument.saveAs.psd(entry);
  }, 'saving psd');
}

async function exportFile() {
  await resizeDocument();
  await saveFile();
}

// Event listener calls
document.getElementById('flattenGroups').addEventListener('click', flattenGroupsMain);
document.getElementById('exportFile').addEventListener('click', exportFile);
