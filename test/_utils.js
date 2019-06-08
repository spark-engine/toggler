const click = async (selector, options) => {
  return await expect(page).toClick(selector, options)
}

const hide = async (selector) => {
  return await page.evaluate(`document.querySelector("${selector}").classList.add("hidden")`)
}

const show = async (selector) => {
  return await page.evaluate(`document.querySelector("${selector}").classList.remove("hidden")`)
}

const isVisible = async (selector) => {
  return await (await page.$(selector)).isIntersectingViewport()
}

const getProperty = async (selector, prop) => {
  return await( await (await page.$(selector)).getProperty(prop)).jsonValue()
}

const isChecked = async (selector) => {
  return await getProperty(selector, 'checked')
}

const findElement = async (selector, options) => {
  return await page.$(selector)
}

const dataset = async (selector, object) => {
  if ( object ) {
    return await page.$eval(selector, (e, object) => e.dataset[object], object)
  } else {
    return JSON.parse( await page.$eval(selector, (e) => JSON.stringify(e.dataset)) )
  }
}

module.exports = {
  click: click,
  show: show,
  hide: hide,
  isVisible: isVisible,
  isChecked: isChecked,
  getProperty: getProperty,
  dataset: dataset
}
