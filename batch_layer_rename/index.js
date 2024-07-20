const { app } = window.require('photoshop');

// Helper function to execute photoshop as modal.
function executePhotoshopModal(callback, commandName) {
  return window.require('photoshop').core.executeAsModal(callback, { commandName });
}

// RENAME AND ADD SUFFIX/PREFIX FUNCTIONALITY
function getInputValue(selector) {
  const selectorValue = document.querySelector(selector).value;
  if (!selectorValue) {
    window.alert('No text entered');
    return null;
  }
  return selectorValue;
}

function renameLayerNames() {
  const newName = getInputValue('#rename_layer_text');
  if (!newName) return;
  executePhotoshopModal(() => {
    app.activeDocument.activeLayers.forEach((layer) => (layer.name = newName));
  }, 'Rename layers');
}

function addPrefix() {
  const prefixText = getInputValue('#add_prefix_text');
  if (!prefixText) return;
  executePhotoshopModal(() => {
    app.activeDocument.activeLayers.forEach((layer) => (layer.name = `${prefixText}_${layer.name}`));
  }, 'Add Prefix');
}

function addSuffix() {
  const suffixText = getInputValue('#add_suffix_text');
  if (!suffixText) return;
  executePhotoshopModal(() => {
    app.activeDocument.activeLayers.forEach((layer) => (layer.name = `${layer.name}_${suffixText}`));
  }, 'Add Suffix');
}

// DELETE EMPTY LAYERS FUNCTIONALITY //
async function isEmpty(layer) {
  if (layer.layers) {
    const results = await Promise.all(layer.layers.map(isEmpty));
    return results.every((result) => result);
  }
  const { left, right, top, bottom } = layer.bounds;
  return right - left === 0 || bottom - top === 0;
}

// Recursively collect names of empty layers.
async function collectEmptyLayers(layers, emptyLayers) {
  for (const layer of layers) {
    if (layer.layers) await collectEmptyLayers(layer.layers, emptyLayers);
    if (await isEmpty(layer)) emptyLayers.push(layer);
  }
}

async function selectEmpty() { 
  const emptyLayers = []
  await collectEmptyLayers(app.activeDocument.layers, emptyLayers);
  if (emptyLayers.length === 0) {
    document.getElementById("layerList").innerHTML = '';
    return;
  }

  document.getElementById("layerList").innerHTML = `
    <ul>${emptyLayers.map((layer) => `<li>${layer.name}</li>`).join("")}</ul>`;
}

async function deleteEmpty() {
  const emptyLayers = []
  await collectEmptyLayers(app.activeDocument.layers, emptyLayers);
  
  if (emptyLayers.length === 0) {
    window.alert('No empty layers to delete.');
    return;
  }
  const confirmed = window.confirm('Are you sure you want to delete empty layers?');
  if (!confirmed) return;

  await executePhotoshopModal(async () => {
    try{
      emptyLayers.forEach((layer) => (layer.delete()));
    } catch(err) {
      console.log(err.message)
    }
    
  }, 'Delete Layers');
  emptyLayers.length = 0;
  document.getElementById("layerList").innerHTML = 'Layers successfully deleted.';
}

// Adding event listeners to buttons
document.getElementById('btnRename').addEventListener('click', renameLayerNames);
document.getElementById('btnPrefix').addEventListener('click', addPrefix);
document.getElementById('btnSuffix').addEventListener('click', addSuffix);
document.getElementById('btnDeleteEmpty').addEventListener('click', deleteEmpty);
document.getElementById('btnSelectEmpty').addEventListener('click', selectEmpty);