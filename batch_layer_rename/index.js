function executePhotoshopModal(callback, commandName) {
  return window.require('photoshop').core.executeAsModal(callback, { commandName });
}

function getInputValue(selector) {
  const selectorValue = document.querySelector(selector).value;
  if (!selectorValue) {
    console.log('No text entered');
    return null;
  }
  return selectorValue;
}

function renameLayerNames() {
  const newName = getInputValue('#rename_layer_text');
  if (!newName) return;

  return executePhotoshopModal(
    () => {
      const app = window.require('photoshop').app;

      app.activeDocument.layers.forEach((layer) => {
        layer.name = newName;
      });
    },'Rename layers');
}


function addPrefix() {
  const prefixText = getInputValue('#add_prefix_text');
  if (!prefixText) return;

  return executePhotoshopModal(
    () => {
      const app = window.require('photoshop').app;

      app.activeDocument.layers.forEach((layer) => {
        layer.name = `${prefixText}_${layer.name}`;
      });
    }, 'Add Prefix');
}

function addSuffix() {
  const suffixText = getInputValue('#add_suffix_text');
  if (!suffixText) return;

  return executePhotoshopModal(
    () => {
      const app = window.require('photoshop').app;

      app.activeDocument.layers.forEach((layer) => {
        layer.name = `${suffixText}_${layer.name}`;
      });
    },'Add Suffix');
}

// Adding event listeners to buttons
document.getElementById('btnRename').addEventListener('click', renameLayerNames);
document.getElementById('btnPrefix').addEventListener('click', addPrefix);
document.getElementById('btnSuffix').addEventListener('click', addSuffix);

//const regExp = /^(.*?)( \(\d+ %\))?$/;
