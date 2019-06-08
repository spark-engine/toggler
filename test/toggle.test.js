const log = function(){ console.log.apply(this, Array.prototype.slice.call(arguments, 1)) }

var click = async (selector, options) => {
  return await expect(page).toClick(selector, options)
}

var hide = async (selector) => {
  return await page.evaluate(`document.querySelector("${selector}").classList.add("hidden")`)
}

var show = async (selector) => {
  return await page.evaluate(`document.querySelector("${selector}").classList.remove("hidden")`)
}

var visible = async (selector) => {
  return await (await page.$(selector)).isIntersectingViewport()
}

var property = async (selector, property) => {
  return await( await (await page.$(selector)).getProperty(property)).jsonValue()
}
var checked = async (selector) => {
  return await property(selector, 'checked')
}

describe("click Toggler", () => {
  beforeAll( async () => {
    await page.goto("http://localhost:8081/click.html")
  })

  it("toggles on click data-toggle", async() => {
    await page.reload()
    await click("#toggler")
    await expect(await visible('#menu')).toBe(false)
    await click("#toggler")
    await expect(await visible('#menu')).toBe(true)
  })

  it("shows on click data-show", async() => {
    await page.reload()
    await hide("#menu")
    await click("#show")
    await expect(await visible('#menu')).toBe(true)
  })

  it("hides on click data-hide", async() => {
    await page.reload()
    await click("#hide")
    await expect(await visible('#menu')).toBe(false)
  })

  it("toggles it's own classname with data-toggle-class", async() => {
    await page.reload()
    await click("#menu")
    await expect(page).toMatchElement("#menu.active")
    await click("#menu")
    await expect(page).toMatchElement("#menu:not(.active)")
  })

  it("toggles classes on other elements", async() => {
    await page.reload()
    await click("#toggle-class")
    await expect(page).toMatchElement("#menu.toggled-active")
    await click("#toggle-class")
    await expect(page).toMatchElement("#menu:not(.toggled-active)")
  })

  it("adds and removes classes on other elements", async() => {
    await page.reload()
    await click("#add-class")
    await expect(page).toMatchElement("#menu.active")

    await click("#remove-class")
    await expect(page).toMatchElement("#menu:not(.active)")
  })
})

describe("checkbox Toggler", () => {
  beforeAll( async () => {
    await page.goto("http://localhost:8081/checkbox.html")
  })

  it("loads hidden (due to data-hide checkbox being checked)", async() => {
    await page.reload()
    await expect(await visible("#menu")).toBe(false)
  })

  it("toggles with toggle checkbox", async() => {
    await page.reload()
    await click('#toggler')
    await expect(await checked('#toggler')).toBe(true)
    await expect(await visible("#menu")).toBe(true)
    await click('#toggler')
    await expect(await checked('#toggler')).toBe(false)
    await expect(await visible("#menu")).toBe(false)
  })

  it("shows with show checkbox", async() => {
    await page.reload()
    await click('#show')
    await expect(await checked('#show')).toBe(true)
    await expect(await visible("#menu")).toBe(true)
    await click('#show')
    await expect(await checked('#show')).toBe(false)
    await expect(await visible("#menu")).toBe(false)
  })

  it("hides with hide checkbox", async() => {
    await page.reload()
    await click('#hide')
    await expect(await checked('#hide')).toBe(false)
    await expect(await visible("#menu")).toBe(true)
    await click('#hide')
    await expect(await checked('#hide')).toBe(true)
    await expect(await visible("#menu")).toBe(false)
  })

  it("toggles classes with toggle-class checkboxes", async() => {
    await page.reload()
    await click('#toggle-class')
    await expect(await checked('#toggle-class')).toBe(true)
    await expect(page).toMatchElement("#menu.active")
    await click('#toggle-class')
    await expect(await checked('#toggle-class')).toBe(false)
    await expect(page).toMatchElement("#menu:not(.active)")
  })

  it("adds classes with add-class checkboxes", async() => {
    await page.reload()
    await click('#add-class')
    await expect(await checked('#add-class')).toBe(true)
    await expect(page).toMatchElement("#menu.active")
    await click('#add-class')
    await expect(await checked('#add-class')).toBe(false)
    await expect(page).toMatchElement("#menu:not(.active)")
  })

  it("adds classes with remove-class checkboxes", async() => {
    await page.reload()
    await click('#remove-class')
    await expect(await checked('#remove-class')).toBe(true)
    await expect(page).toMatchElement("#menu:not(.active)")
    await click('#remove-class')
    await expect(await checked('#remove-class')).toBe(false)
    await expect(page).toMatchElement("#menu.active")
  })
})
