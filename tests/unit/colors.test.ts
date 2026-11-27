import { describe, expect, it } from "vitest";
import { invertHex } from "../../src/render/colors";

describe("invertHex", () => {
  it("inverts each channel of full and shorthand hexadecimal colors", () => {
    expect(invertHex("#123456")).toBe("#edcba9");
    expect(invertHex("#abc")).toBe("#554433");
  });

  it("leaves invalid values unchanged", () => {
    expect(invertHex("red")).toBe("red");
    expect(invertHex("#12")).toBe("#12");
    expect(invertHex("#12345678")).toBe("#12345678");
  });
});
