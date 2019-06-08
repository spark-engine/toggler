const utils = require("./_utils.js")

describe("checkbox Toggler", () => {
  beforeAll( async () => {
    await page.goto("http://localhost:8081/checkbox.html")
  })

  it("loads hidden (due to data-hide checkbox being checked)", async() => {
    await page.reload()
    await expect(await utils.isVisible("#menu")).toBe(false)
  })

  it("toggles with toggle checkbox", async() => {
    await page.reload()
    await utils.click('#toggler')
    await expect(await utils.isChecked('#toggler')).toBe(true)
    await expect(await utils.isVisible("#menu")).toBe(true)
    await utils.click('#toggler')
    await expect(await utils.isChecked('#toggler')).toBe(false)
    await expect(await utils.isVisible("#menu")).toBe(false)
  })

  it("shows with show checkbox", async() => {
    await page.reload()
    await utils.click('#show')
    await expect(await utils.isChecked('#show')).toBe(true)
    await expect(await utils.isVisible("#menu")).toBe(true)
    await utils.click('#show')
    await expect(await utils.isChecked('#show')).toBe(false)
    await expect(await utils.isVisible("#menu")).toBe(false)
  })

  it("hides with hide checkbox", async() => {
    await page.reload()
    await utils.click('#hide')
    await expect(await utils.isChecked('#hide')).toBe(false)
    await expect(await utils.isVisible("#menu")).toBe(true)
    await utils.click('#hide')
    await expect(await utils.isChecked('#hide')).toBe(true)
    await expect(await utils.isVisible("#menu")).toBe(false)
  })

  it("toggles classes with toggle-class checkboxes", async() => {
    await page.reload()
    await utils.click('#toggle-class')
    await expect(await utils.isChecked('#toggle-class')).toBe(true)
    await expect(page).toMatchElement("#menu.active")
    await utils.click('#toggle-class')
    await expect(await utils.isChecked('#toggle-class')).toBe(false)
    await expect(page).not.toMatchElement("#menu.active")
  })

  it("adds classes with add-class checkboxes", async() => {
    await page.reload()
    await utils.click('#add-class')
    await expect(await utils.isChecked('#add-class')).toBe(true)
    await expect(page).toMatchElement("#menu.active")
    await utils.click('#add-class')
    await expect(await utils.isChecked('#add-class')).toBe(false)
    await expect(page).not.toMatchElement("#menu.active")
  })

  it("adds classes with remove-class checkboxes", async() => {
    await page.reload()
    await utils.click('#remove-class')
    await expect(await utils.isChecked('#remove-class')).toBe(true)
    await expect(page).not.toMatchElement("#menu.active")
    await utils.click('#remove-class')
    await expect(await utils.isChecked('#remove-class')).toBe(false)
    await expect(page).toMatchElement("#menu.active")
  })
})
