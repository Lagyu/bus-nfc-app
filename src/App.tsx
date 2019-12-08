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
            setSentMessage("送信成功！\nレスポンス: \n" + JSON.stringify(response.data, null, 2)　+ "\n5秒後に読み取り可能状態に戻ります。")
          }　else {
            setSentMessage("送信失敗...\nレスポンス: \n" + JSON.stringify(response.data, null, 2)　+ "\n5秒後に読み取り可能状態に戻ります。")
          }
          setTimeout(initializeNfc, 5000);
    }
    )
  }

  return (
      <div className="nfc">
        {step === "initializing" ? (
            <div>初期化中...</div>
        ) : step === "noNfc" ? (
            <div>
              デバイスがNFCをサポートしていないか、PhoneGap-NFCプラグインが正しくセットアップされていません。
            </div>
        ) : step === "nfcNotEnabled" ? (
            <div>
              <div>
                NFCがオフになっています。<br />下のボタンから設定を変更してください.
              </div>
              <button className='button-primary' onClick={onGoToSettingsClick}>NFCの設定へ</button>
            </div>
        ) : step === "waitingForNfcEnabled" ? (
            <div>
              <div>設定変更が完了したら、下のボタンを押してください</div>
              <button className='button-primary' onClick={initializeNfc}>NFCリーダーを起動する</button>
            </div>
        ) : step === "waitingForTag" ? (
            <div>
              <div>NFCをタッチしてください...
              </div>
            </div>
        ) : step === "tagRead" ? (
            <div>
              <div>読み取り成功！</div>
              <div>ID: {tagContent}</div>
              <div>
                <button className='button-primary' onClick={() => sendId(tagContent)}>
                  送信
                </button>
                <button className='button-secondary' onClick={initializeNfc}>
                  読み取り再開
                </button>
                <div style={{whiteSpace: 'pre-line'}}>
                  送信の状態：{sentMessage}
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