const utils = require("./_utils.js")

describe("select toggler", () => {
  beforeAll( async () => {
    await utils.goto("fieldset.html")
  })

  it("initializes disabled fieldset matching default selected option", async() => {
    await expect(await utils.getProperty('#select-fieldset', 'selectedIndex')).toBe(2)
    await expect(await utils.getProperty('#panel-one', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-two', 'disabled')).toBe(false)
    await expect(await utils.getProperty('#panel-three', 'disabled')).toBe(true)
  })

  it("disable all panels when none is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'none')
    await expect(await utils.getProperty('#panel-one', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-two', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-three', 'disabled')).toBe(true)
  })

  it("enables panel one and disables two and three when one is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'one')
    await expect(await utils.getProperty('#panel-one', 'disabled')).toBe(false)
    await expect(await utils.getProperty('#panel-two', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-three', 'disabled')).toBe(true)
  })

  it("enables panel two and disables one and three when two is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'two')
    await expect(await utils.getProperty('#panel-one', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-two', 'disabled')).toBe(false)
    await expect(await utils.getProperty('#panel-three', 'disabled')).toBe(true)
  })

  it("enables panel three and disables one and two when two is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'three')
    await expect(await utils.getProperty('#panel-one', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-two', 'disabled')).toBe(true)
    await expect(await utils.getProperty('#panel-three', 'disabled')).toBe(false)
  })
})
