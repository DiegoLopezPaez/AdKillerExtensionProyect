navigator.serviceWorker.register("service-worker.js");
var keepRecording;
var source;
var output;
var media;
let gainNode;
let isMuted = false;

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
  gainNode = output.createGain();
  source.connect(gainNode);
  gainNode.connect(output.destination);
  // source.connect(output.destination);

  window.location.hash = 'recording';
  // Start recording.
  const recordingInterval = 5500; // 6 seconds in milliseconds
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
    await recorder.stop();
    console.log("Termino.")

    data = [];
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
    //window.open(URL.createObjectURL(blob), '_blank');
    //blob = convertWebmToMp3(blob);
    
    // Serializar en JSON
    blobToBase64(blob).then(base64String => {
      console.log(base64String);
      base64String = base64String.split(',')[1];
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
  //  media.getAudioTracks().forEach(track => {
  //   track.enabled = false;
  // });
  if (!isMuted) {
    gainNode.gain.setValueAtTime(0, output.currentTime);
    isMuted = true;
  }
}

async function unmuteAudio(){
    //ESTO PARECE ESTAR FUNCIONANDO, CON ESTO SE SILENCIA LA PESTANIA Y EN TRUE SE DESMUTEA
  // media.getAudioTracks().forEach(track => {
  //   track.enabled = true;
  // });
  if (isMuted) {
    gainNode.gain.setValueAtTime(1, output.currentTime);
    isMuted = false;
  }
}


  //  // output.createGain().gain.value = "0";
  // // source.context.gain.value = "0";
  // const gainNode = output.createGain();
  // // Conectar el nodo de ganancia al destino de AudioContext (que es la salida de audio)
  // gainNode.connect(output.destination);
  // // Establecer el valor de ganancia a cero (para silenciar el audio)
  // gainNode.gain.value = "0";

  // async function convertWebmToMp3(webmBlob){
  //   const ffmpeg = createFFmpeg({ log: false });
  //   await ffmpeg.load();
  
  //   const inputName = 'input.webm';
  //   const outputName = 'output.wav';
  
  //   ffmpeg.FS('writeFile', inputName, await fetch(webmBlob).then((res) => res.arrayBuffer()));
  
  //   await ffmpeg.run('-i', inputName, outputName);
  
  //   const outputData = ffmpeg.FS('readFile', outputName);
  //   const outputBlob = new Blob([outputData.buffer], { type: 'audio/wav' });
  
  //   return outputBlob;
  // }