page.on('console', consoleObj => console.log(consoleObj.text()))

const goto = async (url) => {
  return await page.goto(`http://localhost:8081/${url}`)
}

const click = async (selector, options) => {
  return await expect(page).toClick(selector, options)
}

const hide = async (selector) => {
  return await page.evaluate(`var s = document.querySelector("${selector}"); s.hidden = true; s.classList.add("hidden")`)
}

const show = async (selector) => {
  return await page.evaluate(`var s = document.querySelector("${selector}"); s.hidden = false; s.classList.remove("hidden")`)
}

const isVisible = async (selector) => {
  return await page.evaluate(`document.querySelector("${selector}").hidden != true`)
}

const getProperty = async (selector, prop) => {
  return await( await (await page.$(selector)).getProperty(prop)).jsonValue()
}

const getAttr = async (selector, attr) => {
  return await page.$eval(selector, (el) => JSON.parse(el.getAttribute('aria-selected')))
}

const isChecked = async (selector) => {
  return await getProperty(selector, 'checked')
}

const logHTML = async (selector) => {
  return await page.evaluate(`console.log(document.querySelector("${selector}").outerHTML)`);
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
  goto: goto,
  click: click,
  show: show,
  hide: hide,
  isVisible: isVisible,
  isChecked: isChecked,
  getProperty: getProperty,
  getAttr: getAttr,
  dataset: dataset,
  logHTML: logHTML
}
