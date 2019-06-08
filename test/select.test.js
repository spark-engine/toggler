const utils = require("./_utils.js")

describe("select toggler", () => {
  beforeAll( async () => {
    await page.goto("http://localhost:8081/select.html")
  })

  it("initializes with hidden elements matching cheked state", async() => {
    await expect(await utils.getProperty('#select-toggle', 'selectedIndex')).toBe(2)
    await expect(await utils.isVisible('#panel-one')).toBe(false)
    await expect(await utils.isVisible('#panel-two')).toBe(true)
    await expect(await utils.isVisible('#panel-three')).toBe(false)
  })

  it("hides all panels when none is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'none')
    await expect(await utils.isVisible('#panel-one')).toBe(false)
    await expect(await utils.isVisible('#panel-two')).toBe(false)
    await expect(await utils.isVisible('#panel-three')).toBe(false)
  })

  it("shows panel one and hides panels two and three when one is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'one')
    await expect(await utils.isVisible('#panel-one')).toBe(true)
    await expect(await utils.isVisible('#panel-two')).toBe(false)
    await expect(await utils.isVisible('#panel-three')).toBe(false)
  })

  it("shows panel two and hides panels one and three when two is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'two')
    await expect(await utils.isVisible('#panel-one')).toBe(false)
    await expect(await utils.isVisible('#panel-two')).toBe(true)
    await expect(await utils.isVisible('#panel-three')).toBe(false)
  })

  it("shows panel three and hides panels one and two when three is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'three')
    await expect(await utils.isVisible('#panel-one')).toBe(false)
    await expect(await utils.isVisible('#panel-two')).toBe(false)
    await expect(await utils.isVisible('#panel-three')).toBe(true)
  })

  it("removes classnames one,two,three when none is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'none')
    await expect(page).toMatchElement("#select-toggle.none")
    await expect(page).not.toMatchElement("#select-toggle.one, #select-toggle.two, #select-toggle.three")
    await expect(page).not.toMatchElement("#panels.one, #panels.two, #panels.three")
  })

  it("removes classnames none,two,three when one is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'one')
    await expect(page).toMatchElement("#select-toggle.one")
    await expect(page).not.toMatchElement("#select-toggle.two, #select-toggle.three")
    await expect(page).not.toMatchElement("#panels.two, #panels.three")
  })

  it("removes classnames none,one,three when two is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'two')
    await expect(page).toMatchElement("#select-toggle.two")
    await expect(page).not.toMatchElement("#select-toggle.one, #select-toggle.three")
    await expect(page).not.toMatchElement("#panels.one, #panels.three")
  })

  it("removes classnames none,one,two when three is selected", async() => {
    await expect(page).toSelect('#select-toggle', 'three')
    await expect(page).toMatchElement("#select-toggle.three")
    await expect(page).not.toMatchElement("#select-toggle.one, #select-toggle.two")
    await expect(page).not.toMatchElement("#panels.one, #panels.two")
  })
})
