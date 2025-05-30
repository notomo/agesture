import { describe, expect, it } from "vitest";
import { getSetting, importSetting } from "./setting";

describe("import and export", () => {
  it("can deal default setting", async () => {
    const setting = await getSetting();
    await importSetting(JSON.stringify(setting));

    const got = await getSetting();

    expect(got).toEqual(setting);
  });
});
