function renameLayerNames() {
  return window.require('photoshop').core.executeAsModal(
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

document.getElementById('btnRename').addEventListener('click', renameLayerNames);

//const regExp = /^(.*?)( \(\d+ %\))?$/;
