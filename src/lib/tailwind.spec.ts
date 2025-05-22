import { describe, expect, it } from "vitest";
import { cn } from "./tailwind";

describe("cn function", () => {
  it("should merge basic classes", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should resolve conflicts by keeping the last class", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("should handle conditional classes", () => {
    const result = cn("text-red-500", {
      "bg-blue-500": true,
      "bg-green-500": false,
    });
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should handle arrays of classes", () => {
    const result = cn(["text-red-500", "bg-blue-500"], "p-4");
    expect(result).toBe("text-red-500 bg-blue-500 p-4");
  });

  it("should handle null and undefined values", () => {
    const result = cn("text-red-500", null, undefined, "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });

  it("should merge complex conflicting classes", () => {
    const result = cn("px-2 py-1 bg-red-200", "p-3 bg-blue-500");
    expect(result).toBe("p-3 bg-blue-500");
  });
});
