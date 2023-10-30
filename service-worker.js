// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  
  //CODIGO DEL PROGRAMA, DESCOMENTAR PARA QUE FUNCIONE
  const existingContexts = await chrome.runtime.getContexts({});
  let recording = false;

  const offscreenDocument = existingContexts.find(
    (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
  );

  // If an offscreen document is not already open, create one.
  if (!offscreenDocument) {
    // Create an offscreen document.
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Recording from chrome.tabCapture API'
    });
  } else {
    recording = offscreenDocument.documentUrl.endsWith('#recording');
  }

  if (recording) {
    turn_batch(false, tab);
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen'
    });
    chrome.action.setIcon({ path: 'images/not-recording.png' });
    return;
  }

  turn_batch(true, tab);
  // Get a MediaStream for the active tab.
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id
  });
  
  // Send the stream ID to the offscreen document to start recording.
  chrome.runtime.sendMessage({
    type: 'start-recording',
    target: 'offscreen',
    data: streamId
  });

  chrome.action.setIcon({ path: '/images/recording.png' });
});

//Aca recibimos la data que capturamos de audio de la ventana activa y se la pasamos a nuestra API en python
addEventListener("message", (event) => {
  console.log("Mensaje recibido en SW del offscreen. Enviando resultado a API")
  // console.log(`Message received: ${event.data}`);
  make_prediction(event.data);
});

async function turn_batch(switcher, tab){
  if(switcher){
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: "ON",
    });
  }
  else{
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: "OFF",
    });
  }
}

function make_prediction(audioData){
  // URL de la API a la que deseas enviar la solicitud POST
  const apiUrl = 'http://127.0.0.1:5000/analizar-audio';

  // Configuración de la solicitud
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Puedes ajustar el encabezado según las necesidades de la API
    },
    body: audioData//JSON.stringify(audioData) // Convierte los datos en formato JSON
  };

  // Realizar la solicitud POST
  fetch(apiUrl, requestOptions)
    .then(response => {
      if (!response.ok) {
        console.log(response)
        console.error
        throw new Error('La solicitud no fue exitosa');
      }
      return response.json(); // Parsea la respuesta JSON
    })
    .then(data => {
      console.log('Respuesta de la API:', data.resultado);
      if(data.resultado == 1){
        chrome.runtime.sendMessage({
          type: 'mute',
          target: 'offscreen'
        });
        // Obtener la pestaña activa
        // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        //   const activeTab = tabs[0];

        //   console.log("Muteando pestania...")
        //   // Silenciar la pestaña activa
        //   chrome.tabs.update(activeTab.id, { muted: true });
        // });
      }
      else{
        chrome.runtime.sendMessage({
          type: 'unmute',
          target: 'offscreen'
        });
        // Obtener la pestaña activa
        // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        //   const activeTab = tabs[0];

          
        //   console.log("Des-muteando pestania...")
        //   // Devolver volumen a la pestaña activa
        //   chrome.tabs.update(activeTab.id, { muted: false });
        // });
      }
    })
    .catch(error => {
      console.error('Error en la solicitud:', error);
      // Maneja errores de la solicitud
    });
}

// async function switch_batch(){
//   //BADGE DE OFF Y ON -----------------------------------------------------------------
//   // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
//   const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
//   // Next state will always be the opposite
//   const nextState = prevState === 'ON' ? 'OFF' : 'ON'

//   // Set the action badge to the next state
//   await chrome.action.setBadgeText({
//     tabId: tab.id,
//     text: nextState,
//   });

//   if (nextState === "ON") {
//     // Insert the CSS file when the user turns the extension on
//     await chrome.scripting.insertCSS({
//       files: ["styles/focus-mode.css"],
//       target: { tabId: tab.id },
//     });
//   } else if (nextState === "OFF") {
//     // Remove the CSS file when the user turns the extension off
//     await chrome.scripting.removeCSS({
//       files: ["styles/focus-mode.css"],
//       target: { tabId: tab.id },
//     });
//   }
//   //-------------------------------------------------------------------------------------
// }