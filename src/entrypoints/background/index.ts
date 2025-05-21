import { handleMessage } from "./message-handler";

export default defineBackground({
  main() {
    // Add a message listener for messages from content scripts
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      // Handle message asynchronously
      handleMessage(message).then(() => {
        sendResponse({ success: true });
      });

      // Return true to indicate async response
      return true;
    });
  },
});
