const utils = require("./_utils.js")

describe("tab Toggler", () => {
  beforeAll( async () => {
    await utils.goto("tab.html")
  })

  it("initializes tabs with hidden panels matching selected state", async() => {
    await utils.goto("tab.html")
    await expect(await page.evaluate('window.location.hash')).toBe('')
    await expect(await utils.getAttr('#tab-1', 'aria-selected')).toBe(true)
    await expect(await utils.isVisible('#panel-1')).toBe(true)
    await expect(await utils.isVisible('#panel-2')).toBe(false)
    await expect(await utils.isVisible('#panel-3')).toBe(false)

    await utils.click("#tab-2")
    await expect(await utils.getAttr('#tab-2', 'aria-selected')).toBe(true)
    await expect(await utils.isVisible('#panel-1')).toBe(false)
    await expect(await utils.isVisible('#panel-2')).toBe(true)
    await expect(await utils.isVisible('#panel-3')).toBe(false)

    await utils.click("#tab-3")
    await expect(await utils.getAttr('#tab-3', 'aria-selected')).toBe(true)
    await expect(await utils.isVisible('#panel-1')).toBe(false)
    await expect(await utils.isVisible('#panel-2')).toBe(false)
    await expect(await utils.isVisible('#panel-3')).toBe(true)
  })

  it("changes window.location.hash when tab changes", async() => {
    await utils.goto("tab.html")
    await expect(await page.evaluate('window.location.hash')).toBe('')
    await expect(await utils.getAttr('#tab-1', 'aria-selected')).toBe(true)

    await utils.click("#tab-2")
    await expect(await page.evaluate('window.location.hash')).toBe('#tab2')

    await utils.click("#tab-3")
    await expect(await page.evaluate('window.location.hash')).toBe('#tab3')
  })

  it("changes selected tab with window.location.hash changes", async() => {
    await utils.goto("tab.html#tab2")
    await expect(await utils.getAttr('#tab-1', 'aria-selected')).toBe(false)
    await expect(await utils.getAttr('#tab-2', 'aria-selected')).toBe(true)

    await expect(await page.evaluate('window.location.hash = "#tab3"'))
    await expect(await utils.getAttr('#tab-3', 'aria-selected')).toBe(true)

    await expect(await page.evaluate('window.location.hash = "#tab1"'))
    await expect(await utils.getAttr('#tab-1', 'aria-selected')).toBe(true)
  })
})
