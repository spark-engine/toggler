const utils = require("./_utils.js")

describe("click Toggler", () => {
  beforeAll( async () => {
    await utils.goto("div.html")
  })

  it("toggles on click data-toggle", async() => {
    await page.reload()
    await utils.click("#toggler")
    await expect(await utils.isVisible('#menu')).toBe(false)
    await utils.click("#toggler")
    await expect(await utils.isVisible('#menu')).toBe(true)
  })

  it("shows on click data-show", async() => {
    await page.reload()
    await utils.hide("#menu")
    await utils.click("#show")
    await expect(await utils.isVisible('#menu')).toBe(true)
  })

  it("hides on click data-hide", async() => {
    await page.reload()
    await utils.click("#hide")
    await expect(await utils.isVisible('#menu')).toBe(false)
  })

  it("toggles it's own classname with data-toggle-class", async() => {
    await page.reload()
    await utils.click("#menu")
    await expect(page).toMatchElement("#menu.active")
    await utils.click("#menu")
    await expect(page).not.toMatchElement("#menu.active")
  })

  it("toggles classes on other elements", async() => {
    await page.reload()
    await utils.click("#toggle-class")
    await expect(page).toMatchElement("#menu.toggled-active")
    await utils.click("#toggle-class")
    await expect(page).not.toMatchElement("#menu.toggled-active")
  })

  it("adds and removes classes on other elements", async() => {
    await page.reload()
    await utils.click("#add-class")
    await expect(page).toMatchElement("#menu.active")

    await utils.click("#remove-class")
    await expect(page).not.toMatchElement("#menu.active")
  })
})
