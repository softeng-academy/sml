import { app, protocol, BrowserWindow, dialog, ipcMain }    from 'electron'
import { createProtocol }                                   from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS }                 from 'electron-devtools-installer'
import fs                                                   from 'fs'
import Store                                                from 'electron-store'
import path                                                 from 'path'
//  Creare store for app
const appStore = new Store();

//  Determine environment
const isDevelopment = process.env.NODE_ENV !== 'production'

//  Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

//  Create main window
let win
async function createWindow () {
    win = new BrowserWindow({
        width:  1920,
        height: 1080,
        minHeight: 800,
        minWidth:  800,
        icon: path.join(__dirname, '/../src/resources/images/logo.png'),
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.setTitle('Simple Modeling Language')
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        //  Load the url of the dev server if in development mode
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) 
            win.webContents.openDevTools()
    } 
    else {
        //  Load the index.html when not in development
        createProtocol('app')
        win.loadURL('app://./index.html')
    }
}

//  Quit when all windows are closed.
app.on('window-all-closed', () => {
    //  On macOS it is common for applications and their menu bar
    //  to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin')
        app.quit()
})

app.on('activate', () => {
    //  On macOS it's common to re-create a window in the app when the
    //  dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) 
        createWindow()
})

//  This method will be called when Electron has finished
//  initialization and is ready to create browser windows.
//  Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        //  Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } 
        catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()
    win.maximize()
})

//  Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit')
                app.quit()
        })
    } 
    else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

//  Gather window controls of renderer process
ipcMain.on('minimize',   () => { win.minimize() })
ipcMain.on('maximize',   () => { win.maximize() })
ipcMain.on('unmaximize', () => { win.unmaximize() })
ipcMain.on('close',      () => { win.close() })
ipcMain.on('windowStatus', (event) => {
    event.sender.send('windowStatus', win.isMaximized())
})

//  File saving
ipcMain.on('importFile', (event) => {
    dialog.showOpenDialog({
        properties: [ 'openFile' ], 
        filters: [
            { name: 'SML Files', extensions: [ 'sml.svg', 'sml' ] },
        ]  
    }).then((file) => {
        let path = file.filePaths[0]
        fs.readFile(path, 'utf-8', (err, data) => {
            if (!err) {
                if (path.match(/\.sml$/))
                    path = path + '.svg'
                event.sender.send('importedFile', { data, path })
            }
        })
    })
})
ipcMain.on('saveFile', (event, msg) => {
    if (!msg.path) {
        //  Save As functionality
        const options = {
            title: 'Save file - SML svg',
            buttonLabel: 'Save',
            filters: [
                { name: 'SML SVG Files', extensions: [ 'sml.svg' ] },
                { name: 'All Files', extensions: [ '*' ] }
            ]
        }
        dialog.showSaveDialog(win, options).then((data) => {
            if (data.filePath) {
                fs.writeFileSync(data.filePath, msg.data)
                event.sender.send('fileSaved', data.filePath)
            }
        })
    } 
    else {
        //  Save functionality
        fs.writeFileSync(msg.path, msg.data)
        event.sender.send('fileSaved', msg.path)
    }
})

//  Get darkMode status
ipcMain.on('darkModeStatus', (event) => {
    event.sender.send('darkModeStatus', appStore.get('darkMode') || false)
})
//  Stores dark mode data
ipcMain.on('toggleDarkMode', () => {
    appStore.set('darkMode', !appStore.get('darkMode'))
})
