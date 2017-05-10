'use strict';

const {
  app,
  Menu,
  Tray,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  clipboard,
  dialog,
  shell } = require('electron');

const path = require('path');
const fs   = require('fs');
const robot = require("robotjs");

let mainWindow    = null;
let tray          = null;
let updateOffered = false;

// Hide the icon from the dock if the OS has it.
if (app.dock) {
  app.dock.hide();
}

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    frame: false,
    height: 396,
    width: 300,
    backgroundColor: '#2B2F3B',
    resizable: false,
    center: true,
    skipTaskbar: true,
    show: false,
    title: 'Olden',
    icon: path.join(__dirname, 'img', 'app_icon.png')
  });

  // The trigger used to show/hide the app window.
  // TODO: allow user to set a custom shortcut.
  globalShortcut.register('Cmd+Shift+v', () => {
    if (mainWindow.isVisible()) {
      if (app.hide) {
        // NOTE: to get focus back to the previous window on MacOS we need to
        // hide the app not only the window.
        app.hide();
      } else {
        // NOTE: Windows doesn't have app.hide method, but combination of
        // window.blur and window.hide does the same thing.
        mainWindow.blur();
        mainWindow.hide()
      }
    } else {
      mainWindow.show();
    }
  });

  if (process.platform === 'darwin') {
    tray = new Tray(path.join(__dirname, 'img', 'iconTemplate.png'));
  } else if (process.platform === 'linux') {
    tray = new Tray(path.join(__dirname, 'img', 'iconHighlight@2x.png'));
  } else {
    tray = new Tray(path.join(__dirname, 'img', 'iconHighlight.png'));
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Export', submenu: [
      { label: 'JSON', click(item, focusedWindow) {
        mainWindow.webContents.send('exportClipboardHistoryAsJSON');
      }},
      { label: 'Plain text', click(item, focusedWindow) {
        mainWindow.webContents.send('exportClipboardHistoryAsTXT');
      }}
    ]},
    { label: 'Clear clipboard history', click(item, focusedWindow) {
      mainWindow.webContents.send('clearClipboardHistory');
    }},
    { type: 'separator' },
    { label: 'Quit Olden', click(item, focusedWindow) {
      app.quit();
    }}
  ]);

  tray.setToolTip('Olden')
  tray.setContextMenu(contextMenu)

  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.setVisibleOnAllWorkspaces(true);

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  ipcMain.on('hideWindow', (event, pasteClipboard) => {
    if (app.hide) {
        app.hide();
      } else {
        mainWindow.blur();
        mainWindow.hide()
      }
      
      if(pasteClipboard){
        robot.keyTap('v','command')
      }
  });

  ipcMain.on('offer-update', (event, data) => {
    if (!updateOffered) {
      dialog.showMessageBox({
        type:      'question',
        buttons:   [ 'Cancel', 'Download' ],
        defaultId: 0,
        title:     'A newer version of Olden is available',
        message:   'Would you like to download the update?'
      }, (response) => {
        if (response === 1) {
          shell.openExternal(data.url);
        }

        updateOffered = true;
      });
    }
  });

  ipcMain.on('saveExportedData', (event, data) => {
    dialog.showSaveDialog(null, {
      defaultPath: process.env[ (process.platform === 'win32') ? 'USERPROFILE' : 'HOME' ],
      filters: [{ name: 'JSON', extensions: [ data.format ] }]
    }, (filename) => {
      if (filename) {
        fs.writeFile(filename, data.items, 'utf8', (err, data) => {
          if (err) {
            // TODO: provide more descriptive error message.
            dialog.showErrorBox('Export failed', "Couldn't export clipboard history.");
          } else {
            dialog.showMessageBox(null, {
              type:    'info',
              buttons: [],
              title:   'Export successful',
              message: `All clipboard history has been exported to ${filename}`
            });
          }
        });
      }
    });
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On MacOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
