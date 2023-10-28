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
navigator.serviceWorker.register("service-worker.js");
var keepRecording;
var source;
var output;
var media;

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'start-recording':
        keepRecording = true;
        startRecording(message.data);
        break;
      case 'stop-recording':
        keepRecording = false;
        stopRecording();
        break;
      case 'mute':
        muteAudio();
        break;
      case 'unmute':
        unmuteAudio();
        break;
      default:
        throw new Error('Unrecognized message:', message.type);
    }
  }
});

let recorder;
let data = [];

async function startRecording(streamId) {
  if (recorder?.state === 'recording') {
    throw new Error('Called startRecording while recording is in progress.');
  }

  media = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    }
  });

  // Continue to play the captured audio to the user.
  output = new AudioContext();
  source = output.createMediaStreamSource(media);
  source.connect(output.destination);

  window.location.hash = 'recording';
  // Start recording.
  const recordingInterval = 6000; // 6 seconds in milliseconds
  doRecord(recordingInterval, media, data);
}

async function doRecord(time, media, data){
  while(keepRecording){
    recorder = getNewRecorder(media, data)
    console.log("Empezando a grabar...")
    recorder.start();
    // // Usar await para pausar la ejecución durante 5 segundos.
    console.log("En el timeout, esperando...")
    await new Promise(resolve => setTimeout(resolve, time));
    console.log("Frenando...")
    recorder.stop();
    console.log("Termino.")
  }
}

async function stopRecording() {
  try {
    recorder.stop();
  } catch (error) {
    // Captura cualquier error y lo almacena en la variable "error"
    console.error("Ocurrio un error al frenar la grabacion:c", error);
  }

  // Stopping the tracks makes sure the recording icon in the tab is removed.
  recorder.stream.getTracks().forEach((t) => t.stop());

  // Update current state in URL
  window.location.hash = '';
}

// Convertir el Blob a una cadena base64
async function blobToBase64(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getNewRecorder(media, data){
  ret = new MediaRecorder(media, { mimeType: 'audio/webm' });
  ret.ondataavailable = (event) => data.push(event.data);
  ret.onstop = () => {
    const blob = new Blob(data, { type: 'audio/webm' });
    
    // Serializar en JSON
    blobToBase64(blob).then(base64String => {
      const jsonAudioData = JSON.stringify({ audio: base64String });
      navigator.serviceWorker.ready.then((registration) => {
        registration.active.postMessage(jsonAudioData);
      });
    });

    // Clear state ready for next recording
    ret = undefined;
    data = [];
  };
  return ret;
}


async function muteAudio(){
   //ESTO PARECE ESTAR FUNCIONANDO, CON ESTO SE SILENCIA LA PESTANIA Y EN TRUE SE DESMUTEA
   media.getAudioTracks().forEach(track => {
    track.enabled = false;
  });
}

async function unmuteAudio(){
    //ESTO PARECE ESTAR FUNCIONANDO, CON ESTO SE SILENCIA LA PESTANIA Y EN TRUE SE DESMUTEA
  media.getAudioTracks().forEach(track => {
    track.enabled = true;
  });
}


  //  // output.createGain().gain.value = "0";
  // // source.context.gain.value = "0";
  // const gainNode = output.createGain();
  // // Conectar el nodo de ganancia al destino de AudioContext (que es la salida de audio)
  // gainNode.connect(output.destination);
  // // Establecer el valor de ganancia a cero (para silenciar el audio)
  // gainNode.gain.value = "0";
