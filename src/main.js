'use strict';

const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

app.on("window-all-closed", function () {
    app.quit();
});

app.on("ready", function () {

    // Set App Path To Global
    global.paths = {
        app_path: app.getAppPath()
    };
    console.log(global.paths.app_path);

    mainWindow = new BrowserWindow();
    // mainWindow.loadURL("file://"+__dirname+"/index.html");
    mainWindow.loadURL("file://"+__dirname+"/pages/selector.html"); // Selector Page
    // mainWindow.loadURL("file://"+__dirname+"/pages/import.html"); // Selector Page

    mainWindow.webContents.openDevTools();

    mainWindow.on("closed", function () {
        mainWindow = null;
    });
});
