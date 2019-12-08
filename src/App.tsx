import React from "react";
import "./App.css";

import axios from 'axios'
axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

/** Type for the possible steps of the app */
type TStep =
    | "initializing"
    | "noNfc"
    | "nfcNotEnabled"
    | "waitingForNfcEnabled"
    | "waitingForTag"
    | "cancelled"
    | "tagRead";

const App: React.FC = () => {
  const [step, setStep] = React.useState<TStep>("initializing");
  const [tagContent, setTagContent] = React.useState("");
  const [sentMessage, setSentMessage] = React.useState("送信前");

  // Initialize NFC when the app is started
  React.useEffect(initializeNfc, []);

  function initializeNfc() {
    // If nfc is undefined, NFC is not available on this device, or
    // the app is running in a web browser
    if (typeof nfc !== "undefined") {
      // Register an event listener
      setSentMessage("送信前");
      nfc.addTagDiscoveredListener(
          onTagDiscoveredEvent, // The callback function for the event listener
          () => setStep("waitingForTag"), // Success → We're waiting for an event
          () => setStep("nfcNotEnabled") // Error → NFC must not be enabled
      );
    } else {
      setStep("noNfc");
    }
  }

  function onGoToSettingsClick() {
    if (typeof nfc !== "undefined") {
      // Ask the device to open the NFC settings for the user
      nfc.showSettings(
          () => setStep("waitingForNfcEnabled"),
          () => alert("An error occurred while trying to open the NFC Settings.")
      );
    }
  }

  function onTagDiscoveredEvent(e: PhoneGapNfc.TagEvent) {
    // Unregister the event listener
    nfc.removeTagDiscoveredListener(onTagDiscoveredEvent);

    setTagContent(
        // Retrieve the payload of the tag and decode it
        nfc.bytesToHexString(e.tag.id)
    );

    setStep("tagRead");
  }

  function onStopClick() {
    if (typeof nfc !== "undefined") {
      // Unregister the event listener
      nfc.removeTagDiscoveredListener(onTagDiscoveredEvent);
    }

    setStep("cancelled");
  }

  function sendId(id: String) {
    axios.post('https://iot-dojo-bus.appspot.com/api/ride_record/',
        {
          member_id: id,
          device: "4ac74819-d310-4f74-860b-70dff5063527"
        }
        ).then((response) => {
          if (response.status === 201){
            setSentMessage("送信成功: " + id　+ "\n3秒後に戻ります")
          }　else {
            setSentMessage("送信失敗: " + id　+ "\n3秒後に戻ります")
          }
          setTimeout(initializeNfc, 3000);
    }
    )
  }

  return (
      <div className="nfc">
        {step === "initializing" ? (
            <div>Initializing...</div>
        ) : step === "noNfc" ? (
            <div>
              The device you are using doesn't appear to have NFC; or, the
              PhoneGap-NFC plugin hasn't been set up correctly.
            </div>
        ) : step === "nfcNotEnabled" ? (
            <div>
              <div>
                NFC is not enabled on your device. Click the button bellow to open
                your device's settings, then activate NFC.
              </div>
              <button onClick={onGoToSettingsClick}>Go to NFC Settings</button>
            </div>
        ) : step === "waitingForNfcEnabled" ? (
            <div>
              <div>Please click the button below once you have enabled NFC.</div>
              <button onClick={initializeNfc}>Initialize NFC Reader</button>
            </div>
        ) : step === "waitingForTag" ? (
            <div>
              <div>NFCを待機中...
              </div>
            </div>
        ) : step === "tagRead" ? (
            <div>
              <div>Tag scanned! Here it's content:</div>
              <div>{tagContent}</div>
              <div>
                <button onClick={onStopClick}>Stop NFC Reader</button>
              </div>
              <div>
                <button　onClick={initializeNfc}>
                  読み取り再開
                </button>
                <button onClick={() => sendId(tagContent)}>
                  送信
                </button>
                <div style={{whiteSpace: 'pre-line'}}>
                  {sentMessage}
                </div>
              </div>
            </div>
        ) : (
            <div>
              <div>Bye!</div>
            </div>
        )}
      </div>
  );
};

export default App;