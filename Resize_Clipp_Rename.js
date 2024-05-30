// Define the source and destination directories
var sourceFolder = Folder.selectDialog("Select the source folder");
var destinationFolder = Folder.selectDialog("Select the destination folder");

if (sourceFolder && destinationFolder) {

    // Recursive function to get all files from the directory and subdirectories
    function getAllFiles(folder, rootFolder) {
        var fileList = [];
        var files = folder.getFiles();
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (file instanceof Folder) {
                fileList = fileList.concat(getAllFiles(file, rootFolder));
            } else if (file instanceof File && file.name.match(/\.png$/i)) {
                fileList.push({
                    file: file,
                    relativePath: file.fullName.replace(rootFolder.fullName, "")
                });
            }
        }
        return fileList;
    }

    // Get all PNG files in the source folder and subfolders
    var fileList = getAllFiles(sourceFolder, sourceFolder);

    for (var i = 0; i < fileList.length; i++) {
        var file = fileList[i].file;
        var relativePath = fileList[i].relativePath;
        var destinationPath = new Folder(destinationFolder.fullName + relativePath).parent;

        if (!destinationPath.exists) {
            destinationPath.create();
        }

        if (file instanceof File) {
            // Open the file
            var doc = open(file);

            // Resize the image
            doc.resizeImage(UnitValue(360, "px"), UnitValue(430, "px"));

            // Save the resized image to a temporary file
            var tempFile = new File(Folder.temp + "/" + file.name);
            var tempSaveOptions = new PNGSaveOptions();
            tempSaveOptions.compression = 9;  // Maximum compression
            doc.saveAs(tempFile, tempSaveOptions, true);
            doc.close(SaveOptions.DONOTSAVECHANGES);

            // Import the resized image into the current document
            var newLayerDoc = app.open(tempFile);
            newLayerDoc.selection.selectAll();
            newLayerDoc.selection.copy();
            newLayerDoc.close(SaveOptions.DONOTSAVECHANGES);

            app.activeDocument.paste();
            var importedLayer = app.activeDocument.activeLayer;

            // Move the imported layer to the top of the layer stack
            importedLayer.move(app.activeDocument.artLayers[0], ElementPlacement.PLACEBEFORE);

            // Create the clipping mask
            importedLayer.grouped = true;

            // Set up the export options
            var exportOptions = new ExportOptionsSaveForWeb();
            exportOptions.format = SaveDocumentType.PNG;
            exportOptions.PNG8 = false; // Set to true for PNG-8, false for PNG-24
            exportOptions.transparency = true;
            exportOptions.interlaced = false;
            exportOptions.quality = 100;

            // Save the file to the destination folder with the relative path
            var cardNum = file.name.slice(-7)
            var directoryPath = relativePath.substring(0, relativePath.lastIndexOf("/") + 1);
            
            var saveFile = new File(destinationFolder.fullName + directoryPath + destinationPath.name + cardNum);
            app.activeDocument.exportDocument(saveFile, ExportType.SAVEFORWEB, exportOptions);


            // Remove the imported layer
            importedLayer.remove();

            // Remove the temporary file
            tempFile.remove();
        }
    }
    alert("Processing complete!");
} else {
    alert("No folders selected. Process cancelled.");
}
