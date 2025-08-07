import { handleMessage } from "@/src/feature/message";

export default defineBackground({
  main() {
    browser.runtime.onMessage.addListener(
      (rawMessage, _sender, sendResponse) => {
        handleMessage(rawMessage).then((x) => {
          if (x.type === "message") {
            console.info(x.message);
          }
          sendResponse(x);
        });
        // Return true to indicate async response
        return true;
      },
    );
  },
});
