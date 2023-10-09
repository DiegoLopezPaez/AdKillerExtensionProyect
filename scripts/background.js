chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
      text: "OFF",
    });
  });

  const urbanaFm = 'https://urbanaplayfm.com/vivo/'

  const extensions = 'https://developer.chrome.com/docs/extensions';
  const webstore = 'https://developer.chrome.com/docs/webstore';
  
  chrome.action.onClicked.addListener(async (tab) => {
    //if (tab.url.startsWith(urbanaFm)){
      
      // URL de la API a la que deseas enviar la solicitud POST
      const apiUrl = 'http://127.0.0.1:5000/analizar-audio';

      // Datos que deseas enviar en la solicitud POST (pueden ser un objeto JavaScript)
      const postData = {
        // archivo de audio harcodeado. Aca iria la funcionalidad de tomar audio de pestaña
        campo: 'campo1'
      };

      // Configuración de la solicitud
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Puedes ajustar el encabezado según las necesidades de la API
        },
        body: JSON.stringify(postData) // Convierte los datos en formato JSON
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
            // Obtener la pestaña activa
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              const activeTab = tabs[0];

              // Silenciar la pestaña activa
              chrome.tabs.update(activeTab.id, { muted: true });
            });
          }
          else{
            // Obtener la pestaña activa
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              const activeTab = tabs[0];

              // Silenciar la pestaña activa
              chrome.tabs.update(activeTab.id, { muted: false });
            });
          }
          // Realiza acciones adicionales con los datos de respuesta si es necesario
        })
        .catch(error => {
          console.error('Error en la solicitud:', error);
          // Maneja errores de la solicitud
        });

        // Obtener la pestaña activa
        //chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          //const activeTab = tabs[0];

          // Silenciar la pestaña activa
          //chrome.tabs.update(activeTab.id, { muted: true });
        //});

    //}

    // if (tab.url.startsWith(extensions) || tab.url.startsWith(webstore)) {
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
    // }
  });