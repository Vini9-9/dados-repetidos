const { app, BrowserWindow, dialog, ipcMain, Tray, Menu} = require('electron');
const fs = require('fs');
const os_util = require('node-os-utils');
const os = require("os");
const child_process = require("child_process");
const readLine = require("readline");

let mainWindow;
let isQuiting;
let tray;
// var pathArquivos = './files/';
// var nomeArquivoBanco = 'banco.txt';
// var nomeArquivoNovos = 'numeros-novos-2-1.txt';
var arquivoRepetidos;
var success = false;


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 420,
        // maxWidth:1000,
        icon:"icon.png",

    });
    mainWindow.loadFile('index.html');
    mainWindow.maximize();

    // create system tray
    var appIcon = new Tray("icon.png");
    var contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App', click: function () {
                mainWindow.show()
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true;
                app.quit()
            }
        }
    ]);
    appIcon.setContextMenu(contextMenu);

    mainWindow.on('close', function (event) {
        if(!app.isQuiting){
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    mainWindow.on('minimize', function (event) {
        event.preventDefault();
        mainWindow.hide()
    });

    mainWindow.on('show', function () {
        appIcon.setHighlightMode('always')
    });

}

app.on('ready', createWindow);

// Open Select file dialog
ipcMain.on('select-file', (event, arg) => {
    const path = (dialog.showOpenDialog({ properties: ['openFile', 'openDirectory'] }));
    fs.readdir(path[0], (err, files) =>{
        console.log(path[0]+ '\\' + file);
    })
});

ipcMain.on('execute-files', (event, arg) => {
    console.log(arg)
    if(arg){
        processFiles(arg)
    }
});

function processFiles(arg) {
    var contador = 0;
    dataNovos = fs.readFileSync(arg.pathNovos, { encoding: 'utf8' });
    console.log(`lendo arquivo ${arg.pathNovos} ...`)
  
    const rl = readLine.createInterface({
        input: fs.createReadStream(arg.pathBanco)
    });
  
    try {
        console.log(`lendo arquivo ${arg.pathBanco} ...`)
        rl.on("line", (line) => {
            if (dataNovos.includes(line)) {
                contador++
                console.log('Dado já existe no banco: ' + line);
                fs.appendFile(arg.pathRepetidos, line + '\n', err => {
                    if (err) throw err;
                })
            }
        })
  
        rl.on("close", () => {
            console.log("==============================================")
            if (contador) {
                arquivoRepetidos = arg.pathRepetidos;
                info = `Encontrei ${contador} dados repetidos`
                message = `O arquivo ${arg.pathRepetidos} está pronto`
                success = true
                console.log(info)
                console.log(message)
            } else {
                info = "Nenhum dado repetido encontrado"
                message = "Dados processados com sucesso"
                console.log(info)
            }
            mainWindow.webContents.send('finished', {
                success,
                info,
                message
            })
        })
  
    } catch (error) {
        console.error(err);
        success = false
        info = "Erro encontrado"
        message = err
        mainWindow.webContents.send('finished', {
            success,
            info,
            message
        })
    }
  }

// open notepad
ipcMain.on('open-notepad', (event, arg) => {
    child_process.spawn('C:\\windows\\notepad.exe')
});

// open folder
ipcMain.on('open-file', (event, arg) => {
    child_process.exec(`start "" ${arquivoRepetidos}`)
});
