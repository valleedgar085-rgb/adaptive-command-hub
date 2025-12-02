import { describe, it, expect } from "vitest";
import { cn, getErrorMessage } from "./utils";

describe("cn utility function", () => {
  it("should merge class names", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    const condition = false;
    const result = cn("class1", condition && "class2", "class3");
    expect(result).toBe("class1 class3");
  });

  it("should handle undefined classes", () => {
    const result = cn("class1", undefined, "class3");
    expect(result).toBe("class1 class3");
  });
});

describe("getErrorMessage utility function", () => {
  it("should extract message from Error objects", () => {
    const error = new Error("Test error message");
    expect(getErrorMessage(error)).toBe("Test error message");
  });

  it("should return string errors directly", () => {
    expect(getErrorMessage("String error")).toBe("String error");
  });

  it("should return fallback for unknown error types", () => {
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
    expect(getErrorMessage(123)).toBe("An unexpected error occurred");
  });

  it("should use custom fallback message", () => {
    expect(getErrorMessage({}, "Custom fallback")).toBe("Custom fallback");
  });
});
