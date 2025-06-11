import {
  handleMessage,
  handlePiemenuActionMessage,
} from "@/src/feature/message";

export default defineBackground({
  main() {
    browser.runtime.onMessage.addListener(
      (rawMessage, _sender, sendResponse) => {
        if (rawMessage.type === "piemenuAction") {
          handlePiemenuActionMessage(rawMessage).then(() => {
            sendResponse({ success: true });
          });
          return true;
        }

        handleMessage(rawMessage).then((x) => {
          if ("notice" in x && x.notice) {
            console.log(x.notice);
          }
          sendResponse(x);
        });
        // Return true to indicate async response
        return true;
      },
    );
  },
});
