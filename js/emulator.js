; (function () {

  var mapping = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'SoftRight': 'start',
    'SoftLeft': 'select',
    '9': 'a',
    '8': 'b'
  }, mappingForQwerty = {
    'a': 'left',
    'd': 'right',
    's': 'down',
    'w': 'up',
    'Enter': 'start',
    'q': 'select',
    'l': 'a',
    'k': 'b'
  };
  var config = {}
  var parts = location.search.substr(1).split('&');
  for (var i = 0; i < parts.length; i++) {
    var value = decodeURIComponent(parts[i].split('=')[1]);
    if (!isNaN(parseInt(value))) {
      value = parseInt(value);
    }
    config[parts[i].split('=')[0]] = value;
  }

  function updateTitle(gameTitle) {
    document.getElementById('title').querySelector('h1').textContent = 'KaiBoy: ' + gameTitle
  }

  function saveToSlot(slotNum) {
    if (GameBoyEmulatorInitialized()) {
      pause()
      if (window.confirm('Save to slot ' + slotNum + '?')) {
        let gameName = gameboy.name
        let slotName = 'KaiBoySaveSlot' + slotNum + '_' + gameName
        let slotObject = gameboy.saveState()
        try {
          window.localStorage.setItem(slotName, JSON.stringify(slotObject))
        } catch (e) {
          window.alert('Couldn\'t save the state: ' + e.toString())
        }
        run()
      }
      run()
    }
  }

  function loadFromSlot(slotNum, canvas) {
    if (GameBoyEmulatorInitialized()) {
      pause()
      if (window.confirm('Load from slot ' + slotNum + '?')) {
        let gameName = gameboy.name
        let slotName = 'KaiBoySaveSlot' + slotNum + '_' + gameName
        let slotState = window.localStorage.getItem(slotName)
        if (slotState) {
          let slotObject = null
          try {
            slotObject = JSON.parse(slotState)
          } catch (e) {
            window.alert('Corrupt save data!')
          }
          if (slotObject) {
            gameboy = new GameBoyCore(canvas, "")
            gameboy.savedStateFileName = slotName
            gameboy.returnFromState(slotObject)
            run()
          }
          else run()
        }
        else {
          window.alert('Nothing was saved to this slot yet!')
          run()
        }
      }
      else run()
    }
  }

  function clearAllSlots() {
    let emuInit = GameBoyEmulatorInitialized()
    if (emuInit) pause()
    if (window.confirm('Delete all save slots for all games?')) {
      try {
        for (let key in window.localStorage) {
          if (key.startsWith('KaiBoySaveSlot')) {
            window.localStorage.removeItem(key)
          }
        }
      }
      catch (e) {
        window.alert('Error accessing the slot storage!')
      }
    }
    if (emuInit) run()
  }

  function runGB(romBuffer) {
    var mainCanvas = document.getElementById('mainCanvas'),
      KaiBoyMachinePaused = true

    document.body.classList.add('ingame')

    document.getElementById('choice').innerHTML = 'Select'
    document.getElementById('back').innerHTML = 'Start'
    document.getElementById('ok').innerHTML = '&nbsp;'

    function inGameMode(remapUp) {
      window.onkeydown = function (e) {
        if (e.key in mapping) {
          GameBoyKeyDown(mapping[e.key])
        }
        else if (remapUp && e.key === 'Enter') {
          GameBoyKeyDown(mapping['ArrowUp'])
        }
        else if (e.key === 'Call') {
          if (!KaiBoyMachinePaused) {
            KaiBoyMachinePaused = true
            pause()
          }
          else {
            KaiBoyMachinePaused = false
            run()
          }
        }
        else if (e.key === '1') saveToSlot(1)
        else if (e.key === '4') loadFromSlot(1, mainCanvas)
        else if (e.key === '2') saveToSlot(2)
        else if (e.key === '5') loadFromSlot(2, mainCanvas)
        else if (e.key === '3') saveToSlot(3)
        else if (e.key === '6') loadFromSlot(3, mainCanvas)
        else if (e.key === '7') clearAllSlots()
        else if (e.key === 'Backspace') {
          e.preventDefault()
          KaiBoyMachinePaused = true
          pause()
          if (window.confirm('Exit KaiBoy?'))
            window.close()
          else {
            KaiBoyMachinePaused = false
            run()
          }
        }
      }
      window.onkeyup = function (e) {
        if (e.key in mapping) {
          GameBoyKeyUp(mapping[e.key])
        }
        else if (remapUp && e.key === 'Enter') {
          GameBoyKeyUp(mapping['ArrowUp'])
        }
      }
      let soundOn = window.confirm('Run with sound?')
      start(mainCanvas, romBuffer, soundOn)
      KaiBoyMachinePaused = false
      console.log('ROM loaded:', gameboy.name)
      updateTitle(gameboy.name)
    }
    if (window.screen.orientation.type !== 'landscape-primary') {
      inGameMode(true)
    } else { //running on a QWERTY phone
      mapping = mappingForQwerty
      inGameMode()
    }
  }

  var screenElement = document.getElementById('screen')
  window.addEventListener('load', function () {
    if (config.src) {
      screenElement.innerHTML = 'Loading&hellip;'
      var request = new XMLHttpRequest;
      request.onload = function () {
        let responseView = new Uint8ClampedArray(request.response), l = responseView.length, s = '';
        for (let i = 0; i < l; i++)
          s += String.fromCharCode(responseView[i])
        runGB(s);
      };
      request.open('GET', config.src);
      request.responseType = 'arraybuffer'
      request.send();
    } else {
      var pickKeyHandler = function (e) {
        if (e.key === 'Enter' || e.key === 'Call') {
          var picker = new MozActivity({
            name: "xyz.831337.kaiboy.pickFile",
            data: {}
          })
          picker.onsuccess = function () {
            screenElement.innerHTML = 'Loading&hellip;'
            let reader = new FileReader()

            reader.onload = function (e) {
              window.removeEventListener('keydown', pickKeyHandler)
              let responseView = new Uint8ClampedArray(reader.result), l = responseView.length, s = '';
              for (let i = 0; i < l; i++)
                s += String.fromCharCode(responseView[i])
              runGB(s);
            }

            reader.readAsArrayBuffer(picker.result.file)
          }
        }
      }
      window.addEventListener('keydown', pickKeyHandler)
    }
  })
})()
