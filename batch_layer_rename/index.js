function executePhotoshopModal(callback, commandName) {
  return window.require('photoshop').core.executeAsModal(callback, { commandName });
}

function renameLayerNames() {
  return executePhotoshopModal(
    () => {
      const app = window.require('photoshop').app;

      app.activeDocument.layers.forEach((layer) => {
        layer.name = `${layer.name} (${layer.opacity} %)`;
      });
    },
    {
      commandName: 'Rename layers',
    }
  );
}

function addPrefix() {
  return executePhotoshopModal(
    () => {
      const app = window.require('photoshop').app;

      const prefixText = getPrefixName();

      app.activeDocument.layers.forEach((layer) => {
        layer.name = `${prefixText}_${layer.name}`;
      });
    },
    {
      commandName: 'Append Prefix',
    }
  );
}

function getPrefixName() {
  const prefixText = document.querySelector('#add_prefix_text').value;
  if (!prefixText) {
    console.log('No text entered');
    return;
  }
  return prefixText;
}

document.getElementById('btnRename').addEventListener('click', renameLayerNames);
document.getElementById('btnPrefix').addEventListener('click', addPrefix);

//const regExp = /^(.*?)( \(\d+ %\))?$/;
