const { app, constants } = require('photoshop');
const { storage } = require('uxp');

// Helper function to execute photoshop as modal.
function executePhotoshopModal(callback, commandName) {
  return window.require('photoshop').core.executeAsModal(callback, { commandName });
}

// Suffix name constants
const SWIPE = '_SWIPE';
const MERGE = '_MERGE';

// find all relevant layers that are of kind GROUP and ends with SWIPE or MERGE constants
function findLayers(layers) {
  const mergeGroups = [];
  layers.forEach((layer) => {
    if (layer.layers) {
      const foundLayers = findLayers(layer.layers);
      mergeGroups.push(...foundLayers);
    }
    if (layer.kind === constants.LayerKind.GROUP && (layer.name.endsWith(SWIPE) || layer.name.endsWith(MERGE))) {
      mergeGroups.push(layer);
    }
  });
  return mergeGroups;
}

// Remove suffix from gorups that will be merged, and merges them
function mergeLayers(mergeGroups) {
  executePhotoshopModal(() => {
    mergeGroups.forEach((layer) => {
      layer.name = layer.name.replace(SWIPE, '').replace(MERGE, '');
      layer.merge();
    });
  }, 'merge layers');
}

// Main function that calls findLayers and mergeLayers on button press
function flattenGroupsMain() {
  const documentLayers = app.activeDocument.layers;
  const mergeGroups = findLayers(documentLayers);

  if (mergeGroups.length === 0) {
    window.alert('No layers to merge');
    return;
  }
  mergeLayers(mergeGroups);
}

// Resize and Export document as PSD functionality
async function resizeDocument() {
  await executePhotoshopModal(() => {
    app.activeDocument.resizeImage(1024, 1267);
  }, 'resize document');
}

async function saveFile() {
  const fileNameWithoutExt = app.activeDocument.name.replace(/\.[^/.]+$/, '');
  const entry = await storage.localFileSystem.getFileForSaving(`${fileNameWithoutExt}_EXPORT.psd`);
  await executePhotoshopModal(() => {
    app.activeDocument.saveAs.psd(entry);
  }, 'save psd');
}

async function exportFile() {
  await resizeDocument();
  await saveFile();
}

// Event listener calls
document.getElementById('flattenGroups').addEventListener('click', flattenGroupsMain);
document.getElementById('exportFile').addEventListener('click', exportFile);
