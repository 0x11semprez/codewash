# Microphone feature

## Overview

The Reading skill card uses the Web Speech API for voice-based gameplay. Players speak the displayed word aloud to damage enemies.

## How it works

### Browser build
The game uses `webkitSpeechRecognition`, available in Chromium-based browsers (Chrome, Edge, Opera).

### Portable .exe (Electron) build
Electron ships its own Chromium engine, so the Web Speech API works the same way as in the browser.

## User experience

### Starting a reading battle
1. Click the Reading skill card in the carousel
2. Click "ENCHANT!" to start a battle
3. The microphone starts listening automatically
4. A word appears on screen for the player to read aloud
5. The status indicator shows "Listening..." while the mic is active

### Manual mic control
Players toggle the microphone by clicking the mic button:
- Grey mic icon with "TAP TO SPEAK" = mic is off
- Red pulsing mic icon = mic is listening

### Ending a battle
When the battle ends (closing the battle card), the microphone stops and cleans up:
- Speech recognition stops
- Event listeners are removed
- Audio streams are released

## Technical implementation

### Key functions

#### `startVoiceListener(targetId)`
Initializes and starts the speech recognition engine:
- Creates a `webkitSpeechRecognition` instance
- Configures continuous listening mode
- Sets up event handlers for results, errors, and lifecycle events
- Auto-restarts to maintain continuous listening during battle

#### `toggleMicListener(targetId)`
Handles mic button clicks:
- Checks current listening state
- Stops recognition if active, starts if inactive
- Cleans up resources between toggles

#### `endBattle()`
Cleanup when battle ends:
- Stops speech recognition
- Clears the recognition reference
- Resets UI state (listening status, spoken text)

### Event handlers

#### `onstart`
Sets `isListening` to `true` and updates spoken text to "Listening..."

#### `onend`
Sets `isListening` to `false`. Auto-restarts if still in a Reading battle (continuous mode). Shows "Mic Off" if not restarting.

#### `onerror`
Handles speech recognition errors:
- `no-speech`: user didn't speak (non-fatal, continues listening)
- `not-allowed`: microphone permission denied (stops with error message)
- Other errors: logged to console

#### `onresult`
Processes recognized speech:
- Extracts and normalizes the transcript (uppercase, strip punctuation)
- Checks against the current challenge answer
- Handles homophones (e.g., "SEA" matches "SEE")
- Triggers success or error feedback

## Debugging

### Console logging
Speech recognition events are logged with `[Speech Recognition]` or `[Mic Toggle]` prefix:

```
[Speech Recognition] Initializing for skill: reading
[Speech Recognition] Start command issued
[Speech Recognition] Started listening
[Speech Recognition] Recognized text: HELLO
[Speech Recognition] Correct answer!
```

### Common issues

#### Microphone button does nothing
Symptoms: clicking the mic button has no effect.
Cause: recognition ref exists but listener isn't active.
The `toggleMicListener` function handles this by checking both the ref and the listening state.

#### Auto-restart loop
Symptoms: speech recognition restarts continuously after battle ends.
Cause: `battlingSkillId` check in `onend` handler failing.
`endBattle()` must clear `recognitionRef` before the auto-restart check runs.

#### "Mic permission denied" error
Symptoms: error message appears, mic doesn't work.
Cause: user denied microphone permission or the browser/OS blocks access.
Solutions:
- Browser: check site permissions in browser settings
- Electron: may require additional permissions in OS settings

#### No speech detected
Symptoms: mic shows as listening but doesn't recognize words.
Possible causes: background noise, wrong microphone selected, or the input device isn't configured.
Solutions:
- Check OS audio settings
- Select the correct input device
- Test the microphone in another application

## Electron-specific notes

### Permissions
The Electron app needs no special configuration for microphone access. Chromium handles permission requests the same way as a regular browser.

### Security settings
`electron/main.cjs` uses:
- `nodeIntegration: false` (no Node.js API access in renderer)
- `contextIsolation: true` (isolates renderer process)

These settings do not affect the Web Speech API.

### Build configuration
No special build configuration is needed. Electron's Chromium engine includes speech recognition support.

## Manual testing checklist

### Browser build
- [ ] Start a Reading battle, mic should auto-start
- [ ] Speak a correct word, should damage enemy
- [ ] Speak an incorrect word, should show error animation
- [ ] Click mic button while listening, should turn off
- [ ] Click mic button while off, should turn on
- [ ] Close battle card, mic should stop cleanly
- [ ] Check console for errors

### Portable .exe build
- [ ] Launch the .exe file
- [ ] Start a Reading battle, mic should auto-start
- [ ] Verify mic icon shows red pulsing animation when listening
- [ ] Speak a correct word, should damage enemy and show hit animation
- [ ] Speak an incorrect word, should show red flash/shake animation
- [ ] Toggle mic off and on with the button
- [ ] Speak words with mic manually toggled, should work correctly
- [ ] Close battle card, mic should stop cleanly
- [ ] Start another battle, mic should work again
- [ ] Check console (if dev tools available) for errors

### Homophones
- [ ] Word "SEE": verify "SEA" and "C" also work
- [ ] Word "TO": verify "TWO", "TOO", and "2" also work
- [ ] Word "RED": verify "READ" also works

### Edge cases
- [ ] Deny microphone permission, should show error message
- [ ] Speak a very long word, should be cleaned properly
- [ ] Background noise, should not trigger false positives
- [ ] Rapid clicks on mic button, should toggle cleanly
- [ ] Switch to a different skill then back, mic state should reset
