import { handleMessage } from "@/src/feature/message";

export default defineBackground({
  main() {
    browser.runtime.onMessage.addListener(
      (rawMessage, _sender, sendResponse) => {
        handleMessage(rawMessage).then((x) => {
          if (x.notice) {
            console.log(x.notice);
          }
          sendResponse({ success: true });
        });
        // Return true to indicate async response
        return true;
      },
    );
  },
});
