const utils = require("./_utils.js")

describe("setClass for Toggler", () => {
  beforeAll( async () => {
    await utils.goto("setclass.html")
  })

  it("toggles on click data-toggle", async() => {
    await page.reload()
    await utils.click("#toggler")
    await expect(page).toMatchElement(".is-hidden")
  })
})
