import RFB from './core/rfb.js';
    
let rfb;


function connectedToServer(e) {
    status("Connected to VM");
}

function disconnectedFromServer(e) {
    if (e.detail.clean) {
        status("Disconnected");
    } else {
        status("Something went wrong, connection is closed");
    }
}

function credentialsAreRequired(e) {
    const password = prompt("Please Enter Password");
    rfb.sendCredentials({ password: password });
}

function sendCtrlAltDel() {
    const confirmCtrlAltDelDialog = document.getElementById("confirmCtrlAltDelDialog");
    confirmCtrlAltDelDialog.style.display = "block";

    const blurOverlay = document.getElementById("blurOverlay");
    blurOverlay.style.display = "block";

    const cancelCtrlAltDelButton = document.getElementById("cancelCtrlAltDel");
    const acceptCtrlAltDelButton = document.getElementById("acceptCtrlAltDel");

    acceptCtrlAltDelButton.onclick = function(){
        confirmCtrlAltDelDialog.style.display = "none";
        blurOverlay.style.display = "none";
        rfb.sendCtrlAltDel();
        return false;
    }

    cancelCtrlAltDelButton.onclick = function(){
        confirmCtrlAltDelDialog.style.display = "none";
        blurOverlay.style.display = "none";
    }
}

function sendText() {
    const textInputDialog = document.getElementById("textInputDialog");
    const blurOverlay = document.getElementById("blurOverlay");
    textInputDialog.style.display = "block";
    blurOverlay.style.display = "block";
    const sendTextButton = document.getElementById("sendTextButton");
    const cancelButton = document.getElementById("cancelText");
    const textInputField = document.getElementById("textInputField");

    sendTextButton.onclick = async function() {
        const inputText = textInputField.value;
        textInputDialog.style.display = "none";
        blurOverlay.style.display = "none";
        textInputField.value = "";
        const shiftValues = [33,34,35,36,37,38,40,41,42,43,58,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,94,95,123,124,125];
        if (inputText.trim() !== "") {
            for (let i = 0; i < inputText.length; i++) {
                let n = inputText.charCodeAt(i);
                if(n === 10){
                    rfb.sendKey(0xFF0D);
                }else if(shiftValues.includes(n)){
                    rfb.sendKey(0xFFE1, 0xFFE1, true);
                    rfb.sendKey(n, true);
                    rfb.sendKey(0xFFE1, 0xFFE1, false);
                }else{
                    rfb.sendKey(n, true);
                }
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
        } else {
            alert("The input is empty");
            blurOverlay.style.display = "none";
        }
    };

    cancelButton.onclick = function() {
        textInputDialog.style.display = "none";
        blurOverlay.style.display = "none";
    };
}

function status(text) {
    document.getElementById('status').textContent = text;
}

function readQueryVariable(name, defaultValue) {
    const re = new RegExp('.*[?&]' + name + '=([^&#]*)'),
        match = document.location.href.match(re);

    if (match) {
        return decodeURIComponent(match[1]);
    }

    return defaultValue;
}

function captureScreen(){
    var pngData = rfb.toDataURL("png");
    var downloadLink = document.createElement('a');
    downloadLink.href = pngData;
    downloadLink.download = "image.png";
    downloadLink.click();
}

function disconnectButton(){

    const confirmDisconnectDialog = document.getElementById("confirmDisconnectDialog");
    confirmDisconnectDialog.style.display = "block";

    const blurOverlay = document.getElementById("blurOverlay");
    blurOverlay.style.display = "block";

    const cancelDisconnect = document.getElementById("cancelDisconnect");
    const acceptDisconnect = document.getElementById("acceptDisconnect");

    acceptDisconnect.onclick = function(){
        confirmDisconnectDialog.style.display = "none";
        blurOverlay.style.display = "none";
        rfb.disconnect();
        window.close();
    }

    cancelDisconnect.onclick = function(){
        confirmDisconnectDialog.style.display = "none";
        blurOverlay.style.display = "none";
    }
}

document.getElementById('sendCtrlAltDelButton').onclick = sendCtrlAltDel;
document.getElementById('sendText').onclick = sendText;
document.getElementById('captureScreen').onclick = captureScreen;
document.getElementById('disconnectButton').onclick = disconnectButton;

const host = readQueryVariable('host', window.location.hostname);
let port = readQueryVariable('port', window.location.port);
const password = readQueryVariable('password');
const path = readQueryVariable('path', 'websockify');

status("Connecting");

let url;
if (window.location.protocol === "https:") {
    url = 'wss';
} else {
    url = 'ws';
}
url += '://' + host;
if(port) {
    url += ':' + port;
}
url += '/' + path;

rfb = new RFB(document.getElementById('screen'), url,
    { credentials: { password: password } });

rfb.addEventListener("connect",  connectedToServer);
rfb.addEventListener("disconnect", disconnectedFromServer);
rfb.addEventListener("credentialsrequired", credentialsAreRequired);

rfb.viewOnly = readQueryVariable('view_only', false);
rfb.scaleViewport = readQueryVariable('scale', false);
rfb.capabilities.power = true;

let Keyboard = window.SimpleKeyboard.default;
let myKeyboard = new Keyboard({
onChange: input => onChange(input),
onKeyPress: button => onKeyPress(button),
layout: {
    default: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
        "{tab} q w e r t y u i o p [ ] \\",
        "{capslock} a s d f g h j k l ; ' {enter}",
        "{shiftleft} z x c v b n m , . / {shiftright}",
        "{controlleft} {altleft} {space} {altright} {controlright}"
    ],
    shift: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
        "{tab} Q W E R T Y U I O P { } |",
        '{capslock} A S D F G H J K L : " {enter}',
        "{shiftleftpressed} Z X C V B N M < > ? {shiftrighpressed}",
        "{controlleft} {altleft} {space} {altright} {controlright}"
    ],
    ctrlPressed: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
        "{tab} q w e r t y u i o p [ ] \\",
        "{capslock} a s d f g h j k l ; ' {enter}",
        "{shiftleft} z x c v b n m , . / {shiftright}",
        "{controlleftpressed} {altleft} {space} {altright} {controlrightpressed}"
    ],
    altPressed: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
        "{tab} q w e r t y u i o p [ ] \\",
        "{capslock} a s d f g h j k l ; ' {enter}",
        "{shiftleft} z x c v b n m , . / {shiftright}",
        "{controlleft} {altleftpressed} {space} {altrightpressed} {controlright}"
    ],
    ctrlaltPressed: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
        "{tab} q w e r t y u i o p [ ] \\",
        "{capslock} a s d f g h j k l ; ' {enter}",
        "{shiftleft} z x c v b n m , . / {shiftright}",
        "{controlleftpressed} {altleftpressed} {space} {altrightpressed} {controlrightpressed}"
    ],
    ctrlshift: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
        "{tab} Q W E R T Y U I O P { } |",
        '{capslock} A S D F G H J K L : " {enter}',
        "{shiftleftpressed} Z X C V B N M < > ? {shiftrighpressed}",
        "{controlleftpressed} {altleft} {space} {altright} {controlrightpressed}"
    ],
    altshift: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
        "{tab} Q W E R T Y U I O P { } |",
        '{capslock} A S D F G H J K L : " {enter}',
        "{shiftleftpressed} Z X C V B N M < > ? {shiftrighpressed}",
        "{controlleft} {altleftpressed} {space} {altrightpressed} {controlright}"
    ],
    ctrlaltshift: [
        "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
        "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
        "{tab} Q W E R T Y U I O P { } |",
        '{capslock} A S D F G H J K L : " {enter}',
        "{shiftleftpressed} Z X C V B N M < > ? {shiftrighpressed}",
        "{controlleftpressed} {altleftpressed} {space} {altrightpressed} {controlrightpressed}"
    ],
},
display: {
    "{escape}": "ESC",
    "{tab}": "TAB",
    "{backspace}": "BACKSPACE",
    "{enter}": "ENTER",
    "{capslock}": "CAPS LOCK",
    "{shiftleft}": "SHIFT",
    "{shiftright}": "SHIFT",
    "{shiftleftpressed}": "SHIFT - PRESSED",
    "{shiftrighpressed}": "SHIFT - PRESSED",
    "{controlleft}": "CTRL",
    "{controlright}": "CTRL",
    "{controlleftpressed}": "CTRL - PRESSED",
    "{controlrightpressed}": "CTRL - PRESSED",
    "{altleftpressed}": "ALT - PRESSED",
    "{altrightpressed}": "ALT - PRESSED",
    "{altleft}": "ALT",
    "{altright}": "ALT",
    "{metaleft}": "CMD",
    "{metaright}": "CMD",
    "{space}": "Space bar",
    "{f1}": "F1",
    "{f2}": "F2",
    "{f3}": "F3",
    "{f4}": "F4",
    "{f5}": "F5",
    "{f6}": "F6",
    "{f7}": "F7",
    "{f8}": "F8",
    "{f9}": "F9",
    "{f10}": "F10",
    "{f11}": "F11",
    "{f12}": "F12"
}

});
function onChange(input) {
    // document.querySelector(".input").value = input;
}

let ctrlPressed = false;
let altPressed = false;
let shiftPressed = false;
function onKeyPress(button) {
    if(button === '{backspace}'){
        rfb.sendKey(0xFF08);
    }
    else if(button === '{tab}'){
        rfb.sendKey(0xFF09);
    }else if(button === '{enter}'){
        rfb.sendKey(0xFF0D);
    }else if(button === '{space}'){
        rfb.sendKey(0x0020);
    }else if(button === '.com'){
        var inputText = '.com';
        for(let i = 0; i < inputText.length; i++){
            rfb.sendKey(inputText.charCodeAt(i), true);
        }
    }else if(button === "{shift}" || button === "{shiftleft}" || button === "{shiftright}"){
        rfb.sendKey(0xFFE1, 0xFFE1, true);
        shiftPressed = true;
        updateKeyboardLayout();
    }else if(button === "{shift}" || button === "{shiftleftpressed}" || button === "{shiftrighpressed}"){
        rfb.sendKey(0xFFE1, 0xFFE1, false);
        shiftPressed = false;
        updateKeyboardLayout();
    }else if(button === "{capslock}"){
        if(shiftPressed){
            rfb.sendKey(0xFFE1, 0xFFE1, false);
            shiftPressed = false;
            updateKeyboardLayout();
        }else{
            rfb.sendKey(0xFFE1, 0xFFE1, true);
            shiftPressed = true;
            updateKeyboardLayout();
        }
    }else if(button === '{escape}'){
        rfb.sendKey(0xff1b);
    }else if(button === '{controlleft}' || button === '{controlright}'){
        rfb.sendKey('ControlLeft', 'ControlLeft', true);
        ctrlPressed = true;
        updateKeyboardLayout();
    }else if(button === '{controlleftpressed}' || button === '{controlrightpressed}'){
        rfb.sendKey('ControlLeft', 'ControlLeft', false);
        ctrlPressed = false;
        updateKeyboardLayout();
    }else if(button === '{altleft}' || button === '{altright}'){
        rfb.sendKey(0xFFE9, 0xFFE9, true);
        altPressed = true;
        updateKeyboardLayout();
    }else if(button === '{altleftpressed}' || button === '{altrightpressed}'){
        rfb.sendKey(0xFFE9, 0xFFE9, false);
        altPressed = false;
        updateKeyboardLayout();
    }else if(button === '{f1}'){
        rfb.sendKey(0xFFBE);
    }else if(button === '{f2}'){
        rfb.sendKey(0xFFBF);
    }else if(button === '{f3}'){
        rfb.sendKey(0xFFC0);
    }else if(button === '{f4}'){
        rfb.sendKey(0xFFC1);
    }else if(button === '{f5}'){
        rfb.sendKey(0xFFC2);
    }else if(button === '{f6}'){
        rfb.sendKey(0xFFC3);
    }else if(button === '{f7}'){
        rfb.sendKey(0xFFC4);
    }else if(button === '{f8}'){
        rfb.sendKey(0xFFC5);
    }else if(button === '{f9}'){
        rfb.sendKey(0xFFC6);
    }else if(button === '{f10}'){
        rfb.sendKey(0xFFC7);
    }else if(button === '{f11}'){
        rfb.sendKey(0xFFC8);
    }else if(button === '{f12}'){
        rfb.sendKey(0xFFC9);
    }
    else{
        rfb.sendKey(button.charCodeAt(0), true);
    }

    
}

function updateKeyboardLayout(){
    if (ctrlPressed && altPressed && shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "ctrlaltshift"
        });
    }
    else if (ctrlPressed && altPressed && !shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "ctrlaltPressed"
        });
    }
    else if (ctrlPressed && !altPressed && shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "ctrlshift"
        });
    }
    else if (!ctrlPressed && altPressed && shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "altshift"
        });
    }
    else if (ctrlPressed && !altPressed && !shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "ctrlPressed"
        });
    }
    else if (!ctrlPressed && altPressed && !shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "altPressed"
        });
    }
    else if (!ctrlPressed && !altPressed && shiftPressed) {
        myKeyboard.setOptions({
            layoutName: "shift"
        });
    }
    else {
        myKeyboard.setOptions({
            layoutName: "default"
        });
    }
}
const toggleButton = document.getElementById("toggleButton");

toggleButton.addEventListener("click", () => {
    var keyboard = document.querySelector('.simple-keyboard');
    if (keyboard.style.display === 'none' || keyboard.style.display === '') {
        keyboard.style.display = 'block';
        toggleButton.textContent = "Hide Keyboard";
    } else {
        keyboard.style.display = 'none';
        toggleButton.textContent = "Show Keyboard";
    }
});