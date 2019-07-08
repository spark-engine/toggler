const utils = require("./_utils.js")

describe("radio toggler", () => {
  beforeAll( async () => {
    await utils.goto("radio.html")
  })

  it("initializes with hidden elements matching cheked state", async() => {
    await page.reload()
    await expect(await utils.isVisible("#panel-one")).toBe(false)
    await expect(await utils.isVisible("#panel-two")).toBe(false)
    await expect(await utils.isVisible("#panel-three")).toBe(false)
  })

  it("ignores inputs outside of the form", async() => {
    // This other radio button is outside of the form
    // if it has a data-show property, radio buttons
    // are not being scoped to their form.
    await expect(await utils.dataset('#other-radio','show')).toBeUndefined()
  })

  it("hides all when none is selected", async() => {
    await utils.click("#none")
    await expect(await utils.isVisible("#panel-one")).toBe(false)
    await expect(await utils.isVisible("#panel-two")).toBe(false)
    await expect(await utils.isVisible("#panel-three")).toBe(false)
  })

  it("shows only the first when one is selected", async() => {
    await utils.click("#one")
    await expect(await utils.isVisible("#panel-one")).toBe(true)
    await expect(await utils.isVisible("#panel-two")).toBe(false)
    await expect(await utils.isVisible("#panel-three")).toBe(false)
    await expect(await utils.isVisible("#hide-test")).toBe(false)
  })

  it("shows only the second when two is selected", async() => {
    await utils.click("#two")
    await expect(await utils.isVisible("#panel-one")).toBe(false)
    await expect(await utils.isVisible("#panel-two")).toBe(true)
    await expect(await utils.isVisible("#panel-three")).toBe(false)
  })

  it("shows only the third when three is selected", async() => {
    await utils.click("#three")
    await expect(await utils.isVisible("#panel-one")).toBe(false)
    await expect(await utils.isVisible("#panel-two")).toBe(false)
    await expect(await utils.isVisible("#panel-three")).toBe(true)
  })

  it("should remove classnames one,two,three when none is selected", async() => {
    await utils.click("#none")
    await expect(page).toMatchElement("#panels:not(.one), #panels:not(.two), #panels:not(.three)")
  })

  it("should add only classname one when one is selected", async() => {
    await utils.click("#one")
    await expect(page).toMatchElement("#panels.one")
    await expect(page).not.toMatchElement("#panels.two, #panels.three")
  })

  it("should add only classname two when two is selected", async() => {
    await utils.click("#two")
    await expect(page).toMatchElement("#panels.two")
    await expect(page).not.toMatchElement("#panels.one, #panels.three")
  })

  it("should add only classname three when three is selected", async() => {
    await utils.click("#three")
    await expect(page).toMatchElement("#panels.three")
    await expect(page).not.toMatchElement("#panels.one, #panels.two")
  })
})
