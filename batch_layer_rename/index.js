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

  return executePhotoshopModal(() => {
    const app = window.require('photoshop').app;

    app.activeDocument.activeLayers.forEach((layer) => {
      layer.name = newName;
    });
  }, 'Rename layers');
}

function addPrefix() {
  const prefixText = getInputValue('#add_prefix_text');
  if (!prefixText) return;

  return executePhotoshopModal(() => {
    const app = window.require('photoshop').app;

    app.activeDocument.activeLayers.forEach((layer) => {
      layer.name = `${prefixText}_${layer.name}`;
    });
  }, 'Add Prefix');
}

function addSuffix() {
  const suffixText = getInputValue('#add_suffix_text');
  if (!suffixText) return;

  return executePhotoshopModal(() => {
    const app = window.require('photoshop').app;
    app.activeDocument.activeLayers.forEach((layer) => {
      layer.name = `${layer.name}_${suffixText}`;
    });
  }, 'Add Suffix');
}

// DELETE EMPTY LAYERS FUNCTIONALITY //
async function isEmpty(layer) {
  if (layer.layers) {
    // Recursively check if all sub-layers are empty
    return (await Promise.all(layer.layers.map(async (subLayer) => await isEmpty(subLayer)))).every(
      (isEmpty) => isEmpty
    );
  } else {
    const bounds = layer.bounds;
    const boundsWidth = bounds.right - bounds.left;
    const boundsHeight = bounds.bottom - bounds.top;
    const isEmpty = boundsWidth === 0 || boundsHeight === 0;
    return isEmpty;
  }
}

async function deleteEmptyLayers(layers) {
  for (const layer of layers) {
    if (layer.layers) {
      // Recursively delete empty sub-layers
      await deleteEmptyLayers(layer.layers);
    }
    if (await isEmpty(layer)) {
      layer.delete();
    }
  }
}

async function deleteEmpty() {
  const confirmed = window.confirm('Are you sure?');
  if (!confirmed) return;

  await executePhotoshopModal(async () => {
    const app = window.require('photoshop').app;
    const layers = app.activeDocument.layers;
    await deleteEmptyLayers(layers);
  }, 'Delete Layers');
}

// Adding event listeners to buttons
document.getElementById('btnRename').addEventListener('click', renameLayerNames);
document.getElementById('btnPrefix').addEventListener('click', addPrefix);
document.getElementById('btnSuffix').addEventListener('click', addSuffix);
document.getElementById('btnDeleteEmpty').addEventListener('click', deleteEmpty);
