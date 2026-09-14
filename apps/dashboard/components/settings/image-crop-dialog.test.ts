import { describe, expect, it } from "vitest"

import { getImageBounds } from "./image-crop-dialog"

describe("image crop bounds", () => {
  it("fills a 16:9 carousel crop without distorting the image", () => {
    const bounds = getImageBounds(
      { naturalWidth: 1200, naturalHeight: 1200 },
      1,
      800,
      450
    )

    expect(bounds.width).toBe(800)
    expect(bounds.height).toBe(800)
    expect(bounds.maxX).toBe(0)
    expect(bounds.maxY).toBe(175)
  })
})
