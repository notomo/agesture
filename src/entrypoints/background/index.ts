import { handleMessage } from "./message-handler";

export default defineBackground({
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      handleMessage(message).then(() => {
        sendResponse({ success: true });
      });
      // Return true to indicate async response
      return true;
    });
  },
});
