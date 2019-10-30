var Event            = require("@spark-engine/event"),
    hiddenClass      = "hidden",
    hidingClass      = "hiding",
    showingClass     = "showing",
    visibleClass     = "visible",
    checkboxSelector = "[type=checkbox][data-toggle], [type=checkbox][data-show], [type=checkbox][data-hide]",
    radioSelector    = "input[type=radio][data-show], input[type=radio][data-hide], input[type=radio][data-add-class], input[type=radio][data-remove-class]",
    optionSelector   = "option[data-hide], option[data-show]",
    tabListSelector  = "[role=tablist]",
    tabSelector      = "[role=tab]",
    lastHash         = ""

function listen(){
  Event.on(document, "click change", "[data-toggle], [data-show], [data-hide], [data-toggle-class], [data-add-class], [data-remove-class]", trigger)
  Event.on(document, "change", "[data-select-toggler]", trigger)
  Event.on(window, 'hashchange', hashChange)
}

function hashChange() {
  if (window.location.hash) {

    var anchor = '[data-anchor="'+window.location.hash+'"]'
    var target = document.querySelector(anchor)

    if (target) {
      lastHash = anchor

      if (target.type == 'radio') {
        target.checked = true
      } else if (target.getAttribute('role') === 'tab') {
        // No need to run if the current tab is already selected
        if (target.getAttribute('aria-selected') === 'true') { return }
      } else if (target.tagName == "OPTION") {
        target.closest('select').selectedIndex = target.index
      }

      triggerToggling(target)
    }
  } else if (lastHash) {
    // If a previous tab was selected and a user navigates back, changing the location hash to ''
    // Select the first tab which is the default
    var tab = document.querySelector(lastHash + tabSelector)
    if (tab) {
      var firstTab = tab.closest(tabListSelector).querySelector(tabSelector)
      firstTab.setAttribute('aria-selected', 'true')
      triggerToggling(firstTab)
    }
  }
}

function refresh(){
  selectByUrl()
  toggleCheckboxes()
  setupSelects()
  setupRadios()
  setupTabs()
}

function trigger(event) {
  // Stop event and bubbling if link is only being used as a toggler
  if (event.currentTarget.getAttribute('href') == "#") {
    event.preventDefault()
    event.stop()
  }

  triggerToggling(event.currentTarget, event)
}

function triggerToggling(target, event) {
  var actions = ['hide', 'toggle', 'show', 'removeClass', 'toggleClass', 'addClass']

  // Store the select, and set the target to the current option
  // Events fire on the select, but the options have toggling attributes
  if (target.tagName.match(/select/i)) {
    return triggerToggling(target.selectedOptions[0])
  }

  if (target.getAttribute('role') == 'tab') {
    selectTab(target)
    selectAmongOthers(target)
  } else if (target.tagName == 'OPTION' || target.type == 'radio') {
    selectAmongOthers(target)
  }

  // Radio inputs, tabs, and selects do not support toggling, so remove them
  actions = actions.filter(function(action) {
    if (target.tagName == 'OPTION' || target.type == 'radio' || target.getAttribute('role') == 'tab') {
      return !action.match(/toggle/)
    }
    return target.dataset[action] != null
  })

  // Dispatch all actions
  actions.forEach(function(action) {
    dispatch(target, action)
  })
}

function dispatch(el, type) {
  var action = type
  var data = el.dataset[type]

  // Abort if element doesn't have data for the action
  if (!data || typeof data == 'undefined' || data == '') return

  // Toggle and show are treated the same for checkboxes
  if (el.type == 'checkbox')
    action = (type.match(/hide|remove/i) ? !el.checked : el.checked)

  if (data){
    if (type.match(/class/i)){
      setClass(data, action, el)
    } else {
      setState(data, action)
    }
  }
}

// Add, remove, or toggle classnames, triggered by elements with:
//  data-hide-class, data-show-class, and data-toggle-class values
//
//  Data value examples:
//   - "classname" - add/remove/toggle classname on current element
//   - "foo bar"   - multiple classnames, separated by spaces (like html class property)
//   - "foo bar; selector" - change classnames on elements matched by selector
//   - "foo bar; selector, selector" - match multiple selectors
//
//  You can perform multiple add/remove classes by joining values with an `&`
//  For example: "classname & foo bar; selector"
//  This would toggle classname on current element and toggle `foo bar` classnames
//  on an element matching the selector
//

function setClass(selectors, action, el){
  if(typeof selectors == 'undefined' || selectors == '') return

  if (typeof(action) == 'boolean') {
    action = (action ? 'add' : 'remove')
  }

  if (selectors.match(/&/)) {
    selectors.split('&').forEach(function(sel){
      setClass(sel.trim(), action, el)
    })
    return
  }

  // Get selector and classnames, format: "classname classname; selector,selector"
  var settings = selectors.split(';')
  var classnames = settings[0].trim()
  var matches = []
  selectors = settings[1]

  if (selectors) {
    matches = document.querySelectorAll(selectors)

  // If no slectors are present, and el is an OPTION, use its SELECT as the matched element
  } else if (el && el.tagName.match(/option/i)) {
    matches = [getSelectFromOption(el)]

  // If no slectors are present, use the current el for classnames
  } else if (el) {
    matches = [el]
  }

  Array.prototype.forEach.call(matches, function(match){
    Array.prototype.forEach.call(classnames.split(' '), function(classname) {
      var method = action.replace(/Class/,'')
      match.classList[method](classname)
    })

    triggerTogglerEventsOnChildren(match, 'class')
  })
}

function setState(selectors, state) {
  var matches = document.querySelectorAll(selectors)

  Array.prototype.forEach.call(matches, function(match){
    var action = toggleAction(match, state)

    if (action == 'show') show(match)
    else if (action == "hide") hide(match)

    triggerTogglerEventsOnChildren(match, action)
  })
}

function toggleAction(el, action) {

  if (typeof action == 'boolean') {
    action = (action ? 'show' : 'hide')
  }

  if (action == 'toggle') {
    if (el.classList.contains(hiddenClass) || el.classList.contains(hidingClass)) {
      action = 'show'
    } else {
      action = 'hide'
    }
  }

  return action
}

function show(el) {
  if (el.classList.contains(visibleClass) ||
       el.classList.contains(showingClass) ||
       el.offsetParent != null) {
    return
  }
  el.classList.remove(hiddenClass, hidingClass)
  el.hidden = false

  var showNow = function() {
    // Remove hidden because it might be added before this fires
    el.classList.remove(showingClass, hiddenClass)
    el.classList.add(visibleClass)

    // Enable inputs, fieldsets or forms when shown
    if (typeof el.disabled != 'undefined'){
      el.disabled = false
    }

    // Focus on key element if an element expects focus
    var focusEl = el.querySelector('[data-focus]')
    if (focusEl) { focusEl.focus() }
  }

  if (el.dataset.animate) {
    Event.afterAnimation(el, showNow, true)
    el.classList.add(showingClass)
  } else {
    showNow()
  }
}

function hide(el) {
  if (el.classList.contains(hiddenClass) ||
       el.classList.contains(hidingClass)) {
    return
  }

  // Remove showing because it might be added before this fires
  el.classList.remove(visibleClass, showingClass)

  var hideNow = function() {
    el.classList.remove(hidingClass, visibleClass)
    el.classList.add(hiddenClass)
    el.hidden = true

    // Disable inputs, fieldsets or forms when hidden
    if (typeof el.disabled != 'undefined'){
      el.disabled = true
    }
  }

  if (el.dataset.animate) {
    Event.afterAnimation(el, hideNow, true)
    el.classList.add(hidingClass)
  } else {
    hideNow()
  }
}

function getLeafNodes(parent) {
  // is the parent itself a leaf node?
  if (!parent.hasChildNodes()) return [parent]

  var nodes = Array.prototype.slice.call(parent.getElementsByTagName("*"), 0)

  return nodes.filter(function(elem) {
    return elem.children && elem.children.length === 0
  })
}

function triggerTogglerEventsOnChildren(el, eventName){
  // we care about leaf nodes since the event will bubble to
  // non-leaf nodes from the leaf nodes
  var leafChildNodes = getLeafNodes(el)

  Array.prototype.forEach.call(leafChildNodes, function(node) {
    // 'toggler:show', 'toggler:hide', etc
    Event.fire(node, "toggler:" + eventName)
  })
}

function toggleCheckboxes(checkboxes) {
  checkboxes = checkboxes || document.querySelectorAll(checkboxSelector)

  Array.prototype.forEach.call(checkboxes, triggerToggling)
}

function setupRadios() {
  Array.prototype.forEach.call(document.querySelectorAll(radioSelector), function(radio){
    if (!radio.dataset.togglerActive) {

      var radioName         = radio.getAttribute('name'),
          radios            = parentForm(radio).querySelectorAll('[type=radio][name="'+radioName+'"]'),
          checked

      Array.prototype.forEach.call(radios, function(r){
        r.dataset.togglerActive = true
        if(r.checked) checked = r
      })

      if (checked) {
        triggerToggling(checked)
      } else {
        hideOthers(radios)
        removeClassOnOthers(radios)
      }
    }

  })
}

// Add data-hide to each <option> containing the selectors from other
// option's data-show. This makes the toggling of elements exclusive.
function setupSelects(){
  Array.prototype.forEach.call(document.querySelectorAll(optionSelector), function(option){
    var select = option.closest('select')

    // Mark selects to prevent double processing for each option.
    if (!select.dataset.selectToggler) {
      select.dataset.selectToggler = true
      triggerToggling(select)
    }
  })
}

function setupTabs() {
  Array.prototype.forEach.call(document.querySelectorAll(tabListSelector), function(tabList) {
    var tabs = tabList.querySelectorAll(tabSelector)
    if (tabs.length == 0) return

    Array.prototype.forEach.call(tabs, function(tab) {
      var controls = tab.getAttribute('aria-controls')
      if(controls) tab.dataset.show = "#"+controls
    })

    var selectedTab = tabList.querySelector('[data-anchor="'+window.location.hash+'"]') ||
                      tabList.querySelector('[aria-selected=true]') ||
                      tabList.querySelectorAll(tabSelector)[0]

    triggerToggling(selectedTab)
  })
}

function getSiblingEls(el) {
  var elements

  if (el.type == 'radio') {
    elements = parentForm(el).querySelectorAll('[type=radio][name="'+el.getAttribute('name')+'"]')
  } else if (el.getAttribute('role') == 'tab') {
    elements = el.closest(tabListSelector).querySelectorAll(tabSelector)
  } else if (el.tagName == "OPTION") {
    elements = el.closest('select').querySelectorAll('option')
  }

  return Array.prototype.filter.call(elements, function(e) { return e != el })
}

function hideOthers(others, el) {
  var hideSelectors = showAttributes(others)
  if (el) {
    var showSelectors = (el.dataset.show || '').split(',')
    hideSelectors = hideSelectors.filter(function(selector) {
      return showSelectors.indexOf(selector) < 0
    })
  }

  setState(hideSelectors.join(','), 'hide')
}

function removeClassOnOthers(others) {
  Array.prototype.forEach.call(others, function(other) {
    setClass(other.dataset.addClass, 'remove', other)
  })
}

function selectByUrl() {
  if (window.location.hash.length < 1) { return }

  Array.prototype.forEach.call(document.querySelectorAll('[data-anchor="'+window.location.hash+'"]'), function(el) {
    if (el.tagName == 'OPTION') {
      el.closest('select').selectedIndex = el.index
    } else if (el.getAttribute('role') == 'tab') {
      el.setAttribute('aria-selected', 'true')
    } else if (el.type == 'radio') {
      el.checked = true
    }
  })
}

function selectTab(tab) {
  // Deselect sibling tabs
  Array.prototype.forEach.call(getSiblingEls(tab), function(t) {
    t.setAttribute('aria-selected', 'false')
  })

  // Don't set selected and change url if the current tab is already selected
  if (tab.getAttribute('aria-selected') !== 'true') {

    tab.setAttribute('aria-selected', true)

    if (tab.dataset.anchor && window.location.hash != tab.dataset.anchor) {
      window.location.hash = tab.dataset.anchor
    }
  }
}

function selectAmongOthers(el) {
  var siblings = getSiblingEls(el)
  if (siblings.length < 1) { return }

  hideOthers(siblings, el)
  removeClassOnOthers(siblings)
}

// Find parent <select> for an option (accounts for option groups)
function getSelectFromOption(el) {
  return el.closest('select')
}


// Find parent <form> or document if there is no form
function parentForm(element) {
  var el = element

  while (el && el.tagName != "FORM") {
    el = el.parentNode
  }

  return el || document
}

// Return a unique array of all data attribute values from elements
function showAttributes(elements) {
  return Array.prototype.map.call(elements, function(el) {
    return el.dataset.show
  }).join(',').split(',').filter(function(selectors, index, self) {
    // Only keep array items if they are truthy and not duplicates.
    return selectors != "" && selectors != null && typeof selectors != 'undefined' && self.indexOf(selectors) === index
  })
}

Event.ready(listen)
Event.change(refresh)

module.exports = {
  set: function(options) {
    if(options.hidden)  hiddenClass  = options.hidden
    if(options.hiding)  hidingClass  = options.hiding
    if(options.showing) showingClass = options.showing
    if(options.visible) visibleClass = options.visible
  }
}
