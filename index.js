var Event            = require('@spark-engine/event'),
    hiddenClass      = 'hidden',
    hidingClass      = 'hiding',
    showingClass     = 'showing',
    visibleClass     = 'visible',
    checkboxSelector = "[type=checkbox][data-toggle], [type=checkbox][data-show], [type=checkbox][data-hide]",
    radioSelector    = "input[type=radio][data-show], input[type=radio][data-hide], input[type=radio][data-add-class], input[type=radio][data-remove-class]",
    selectSelector   = "option[data-hide], option[data-show]"

function listen(){
  Event.on(document, "click change", "[data-toggle], [data-show], [data-hide], [data-toggle-class], [data-add-class], [data-remove-class]", trigger)
  Event.on(document, "change", "[data-select-toggler]", trigger)
  Event.on(window, 'hashchange', hashChange)
}

function hashChange() {
  if ( window.location.hash ) {

    var anchor = '[data-anchor="'+window.location.hash+'"]'
    var target = document.querySelector( 'input'+anchor+ ', option'+anchor )

    if ( target ) {
      if ( target.type == 'radio' ) {
        target.checked = true
      } else {
        var select = getSelectFromOption(target)
        select.selectedIndex = target.index
        target = select
      }
      triggerToggling( target )
    }
  }
}

function refresh(){
  toggleCheckboxes()
  setupSelects()
  setupRadios()
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
  var select

  // Store the select, and set the target to the current option
  // Events fire on the select, but the options have toggling attributes
  if (target.tagName.match(/select/i)) {
    select = target
    target = select.selectedOptions[0]
  }

  // Radio inputs and selects do not support toggling, so remove them
  actions = actions.filter(function(action) {
    if (select || target.type == 'radio') {
      return !action.match(/toggle/)
    }
    return target.dataset[action] != null
  })

  // Dispatch all actions
  actions.forEach( function( action ) {
    dispatch( target, action )
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
    else if (action == "hide" ) hide(match)

    triggerTogglerEventsOnChildren(match, action)
  })
}

function toggleAction( el, action ) {

  if ( typeof action == 'boolean' ) {
    action = ( action ? 'show' : 'hide' )
  }

  if (action == 'toggle') {
    if ( el.classList.contains(hiddenClass) || el.classList.contains(hidingClass) ) {
      action = 'show'
    } else {
      action = 'hide'
    }
  }

  return action
}

function show(el) {
  if ( el.classList.contains( visibleClass ) ||
       el.classList.contains( showingClass ) ||
       el.offsetParent != null ) {
    return
  }
  el.classList.remove( hiddenClass, hidingClass )

  var fullyShow = function() {
    // Remove hidden because it might be added before this fires
    el.classList.remove( showingClass, hiddenClass )
    el.classList.add( visibleClass )

    // Enable inputs, fieldsets or forms when shown
    if ( typeof el.disabled != 'undefined' ){
      el.disabled = false
    }

    // Focus on key element if an element expects focus
    var focusEl = el.querySelector('[data-focus]')
    if (focusEl) { focusEl.focus() }

    // Trigger input event on ranges that have been hidden
    var ranges = el.querySelectorAll('[type=range]')
  }

  if ( el.dataset.animate ) {
    Event.afterAnimation( el, fullyShow, true)
    el.classList.add( showingClass )
  } else {
    fullyShow()
  }
}

function hide(el) {
  if ( el.classList.contains( hiddenClass ) ||
       el.classList.contains( hidingClass ) ) {
    return
  }

  // Remove showing because it might be added before this fires
  el.classList.remove( visibleClass, showingClass )

  var fullyHide = function() {
    el.classList.remove( hidingClass, visibleClass )
    el.classList.add( hiddenClass )

    // Disable inputs, fieldsets or forms when hidden
    if ( typeof el.disabled != 'undefined' ){
      el.disabled = true
    }
  }

  if ( el.dataset.animate ) {
    Event.afterAnimation( el, fullyHide, true)
    el.classList.add( hidingClass )
  } else {
    fullyHide()
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
  Array.prototype.forEach.call(document.querySelectorAll(radioSelector), function(radio, index){
    if (!radio.dataset.togglerActive) {

      var radioName         = radio.getAttribute('name'),
          siblings          = parentForm(radio).querySelectorAll('[type=radio][name="'+radioName+'"]'),
          showSelectors     = dataAttributes(siblings, 'show'),
          addClassSelectors = dataAttributes(siblings, 'addClass'),
          checked

      Array.prototype.forEach.call(siblings, function(r){

        if (r.dataset.anchor && window.location.hash == ('#'+r.dataset.anchor.replace('#',''))) {
          r.checked = true
        }

        // Ensure that all radio buttons in a group have a default data-show value of ''
        // This means that unset data-show values will toggle off everything
        //
        r.dataset.show = r.dataset.show || ''
        r.dataset.addClass = r.dataset.addClass || ''

        // Append element's data-hide to showSelectors
        if ( r.dataset.hide && r.dataset.hide.length > 0 )
          showSelectors = showSelectors.concat( r.dataset.hide.split( ',' ) )

        r.dataset.hide = showSelectors.filter(function(selector){
          return r.dataset.show.indexOf( selector )
        }).join(',')

        // Ensure that all radio buttons in a group have a default data-add-class value of ''
        // This means that unset data-add-class values are toggle off all classes
        //
        r.dataset.addClass = r.dataset.addClass || ''

        // Ensure that selected radio buttons remove classes according
        // to the deselected radio buttons
        r.dataset.removeClass = addClassSelectors.filter(function(selector){
          return r.dataset.addClass.indexOf( selector )
        }).join('&')


        r.dataset.togglerActive = true


        if( r.checked ) checked = r

      })

      if ( checked ) {
        triggerToggling( checked )
      } else {
        setState( showSelectors.join(','), 'hide' )
        setClass( addClassSelectors.join(' & '), 'removeClass' )
      }
    }

  })
}

// Add data-hide to each <option> containing the selectors from other
// option's data-show. This makes the toggling of elements exclusive.
//
function setupSelects(){
  Array.prototype.forEach.call(document.querySelectorAll(selectSelector), function(option){
    // Prevent an option from being considered twice
    if (!option.dataset.togglerActive) {

      option.dataset.show = option.dataset.show || ''

      var select = getSelectFromOption(option)
      select.dataset.selectToggler = true
      var options = select.querySelectorAll('option')

      var showSelectors     = dataAttributes(options, 'show')
      var addClassSelectors = dataAttributes(options, 'addClass')

      Array.prototype.forEach.call(options, function(o, index) {

        if (o.dataset.anchor && window.location.hash == ('#'+o.dataset.anchor.replace('#',''))) {
          select.selectedIndex = index
        }

        o.dataset.show = o.dataset.show || ''
        o.dataset.addClass = o.dataset.addClass || ''

        // Append element's data-hide to showSelectors
        if ( o.dataset.hide && o.dataset.hide.length > 0 )
          showSelectors = showSelectors.concat( o.dataset.hide.split( ',' ) )

        // If show selectors are not present in element's data-show
        // Add them to the list of selectors to be hidden
        o.dataset.hide = showSelectors.filter(function(selector){
          return o.dataset.show.indexOf( selector )
        }).join(',')

        o.dataset.removeClass = addClassSelectors.filter(function(selector){
          return o.dataset.addClass.indexOf( selector )
        }).join(' & ')

        o.dataset.togglerActive = true
      })

      // Ensure that currently selected option is toggled properly
      //
      triggerToggling(select)
    }
  })
}

// Find parent <select> for an option (accounts for option groups)
//
function getSelectFromOption(el) {
  var p = el.parentElement

  if (p.tagName == 'SELECT') {
    return p
  } else {
    return getSelectFromOption(p)
  }
}


// Find parent <form> or document if there is no form
//
function parentForm(element) {
  var el = element

  while (el && el.tagName != "FORM") {
    el = el.parentNode
  }

  return el || document
}

// Return a unique array of all data attribute values from elements
//
function dataAttributes(elements, attr) {
  return Array.prototype.map.call(elements, function(el) {
    return el.dataset[attr]
  }).filter(function(selectors, index, self) {
    return selectors != "" && typeof selectors != 'undefined' && self.indexOf(selectors) === index
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
