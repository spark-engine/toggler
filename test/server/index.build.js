(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"@spark-engine/event":3}],2:[function(require,module,exports){
/*!
  * Bean - copyright (c) Jacob Thornton 2011-2012
  * https://github.com/fat/bean
  * MIT license
  */
(function (name, context, definition) {
  // Fallback for node
  if (typeof window === 'undefined') { return null; }
  if (typeof module != 'undefined' && module.exports) module.exports = definition(name, context)
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition(name, context)
})('bean', this, function (name, context) {
  name    = name    || 'bean'
  context = context || this

  var win            = window
    , old            = context[name]
    , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
    , nameRegex      = /\..*/
    , addEvent       = 'addEventListener'
    , removeEvent    = 'removeEventListener'
    , doc            = document || {}
    , root           = doc.documentElement || {}
    , W3C_MODEL      = root[addEvent]
    , eventSupport   = W3C_MODEL ? addEvent : 'attachEvent'
    , ONE            = {} // singleton for quick matching making add() do one()

    , slice          = Array.prototype.slice
    , str2arr        = function (s, d) { return s.split(d || ' ') }
    , isString       = function (o) { return typeof o == 'string' }
    , isFunction     = function (o) { return typeof o == 'function' }
    , isObject       = function (o) { return typeof o == 'object' }

    // Try to build an options object. If any key in `maybeOptions`
    // matches a key in `defaults`, it will be copied into a clone
    // of `defaults`, thus overriding the default.
    , buildOptions = function (originalDefaults, maybeOptions) {
        var defaults = {}

        for (var key in originalDefaults) {
          if (originalDefaults.hasOwnProperty(key)) {
            defaults[key] = originalDefaults[key];
          }
        }

        if (!isObject(maybeOptions)) {
          return defaults;
        }

        for (key in defaults) {
          if (defaults.hasOwnProperty(key) && maybeOptions.hasOwnProperty(key)) {
            defaults[key] = maybeOptions[key]
          }
        }

        return defaults
      }

      // events that we consider to be 'native', anything not in this list will
      // be treated as a custom event
    , standardNativeEvents =
        'click dblclick mouseup mousedown contextmenu '                  + // mouse buttons
        'mousewheel mousemultiwheel DOMMouseScroll '                     + // mouse wheel
        'mouseover mouseout mousemove selectstart selectend '            + // mouse movement
        'keydown keypress keyup '                                        + // keyboard
        'orientationchange '                                             + // mobile
        'focus blur change reset select submit '                         + // form elements
        'load unload beforeunload resize move DOMContentLoaded '         + // window
        'readystatechange message '                                      + // window
        'error abort scroll '                                              // misc
      // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
      // that doesn't actually exist, so make sure we only do these on newer browsers
    , w3cNativeEvents =
        'show '                                                          + // mouse buttons
        'input invalid '                                                 + // form elements
        'touchstart touchmove touchend touchcancel '                     + // touch
        'gesturestart gesturechange gestureend '                         + // gesture
        'textinput '                                                     + // TextEvent
        'readystatechange pageshow pagehide popstate '                   + // window
        'hashchange offline online '                                     + // window
        'afterprint beforeprint '                                        + // printing
        'dragstart dragenter dragover dragleave drag drop dragend '      + // dnd
        'loadstart progress suspend emptied stalled loadmetadata '       + // media
        'loadeddata canplay canplaythrough playing waiting seeking '     + // media
        'seeked ended durationchange timeupdate play pause ratechange '  + // media
        'volumechange cuechange '                                        + // media
        'checking noupdate downloading cached updateready obsolete '       // appcache

      // convert to a hash for quick lookups
    , nativeEvents = (function (hash, events, i) {
        for (i = 0; i < events.length; i++) events[i] && (hash[events[i]] = 1)
        return hash
      }({}, str2arr(standardNativeEvents + (W3C_MODEL ? w3cNativeEvents : ''))))

      // custom events are events that we *fake*, they are not provided natively but
      // we can use native events to generate them
    , customEvents = (function () {
        var isAncestor = 'compareDocumentPosition' in root
              ? function (element, container) {
                  return container.compareDocumentPosition && (container.compareDocumentPosition(element) & 16) === 16
                }
              : 'contains' in root
                ? function (element, container) {
                    container = container.nodeType === 9 || container === window ? root : container
                    return container !== element && container.contains(element)
                  }
                : function (element, container) {
                    while (element = element.parentNode) if (element === container) return 1
                    return 0
                  }
          , check = function (event) {
              var related = event.relatedTarget
              return !related
                ? related == null
                : (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString())
                    && !isAncestor(related, this))
            }

        return {
            mouseenter: { base: 'mouseover', condition: check }
          , mouseleave: { base: 'mouseout', condition: check }
          , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
        }
      }())

      // we provide a consistent Event object across browsers by taking the actual DOM
      // event object and generating a new one from its properties.
    , Event = (function () {
            // a whitelist of properties (for different event types) tells us what to check for and copy
        var commonProps  = str2arr('altKey attrChange attrName bubbles cancelable ctrlKey currentTarget ' +
              'detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey '  +
              'srcElement target timeStamp type view which propertyName path')
          , mouseProps   = commonProps.concat(str2arr('button buttons clientX clientY dataTransfer '      +
              'fromElement offsetX offsetY pageX pageY screenX screenY toElement movementX movementY region'))
          , mouseWheelProps = mouseProps.concat(str2arr('wheelDelta wheelDeltaX wheelDeltaY wheelDeltaZ ' +
              'axis')) // 'axis' is FF specific
          , keyProps     = commonProps.concat(str2arr('char charCode key keyCode keyIdentifier '          +
              'keyLocation location isComposing code'))
          , textProps    = commonProps.concat(str2arr('data'))
          , touchProps   = commonProps.concat(str2arr('touches targetTouches changedTouches scale rotation'))
          , messageProps = commonProps.concat(str2arr('data origin source'))
          , stateProps   = commonProps.concat(str2arr('state'))
          , overOutRegex = /over|out/
            // some event types need special handling and some need special properties, do that all here
          , typeFixers   = [
                { // key events
                    reg: /key/i
                  , fix: function (event, newEvent) {
                      newEvent.keyCode = event.keyCode || event.which
                      return keyProps
                    }
                }
              , { // mouse events
                    reg: /click|mouse(?!(.*wheel|scroll))|menu|drag|drop/i
                  , fix: function (event, newEvent, type) {
                      newEvent.rightClick = event.which === 3 || event.button === 2
                      newEvent.pos = { x: 0, y: 0 }
                      if (event.pageX || event.pageY) {
                        newEvent.clientX = event.pageX
                        newEvent.clientY = event.pageY
                      } else if (event.clientX || event.clientY) {
                        newEvent.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                        newEvent.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
                      }
                      if (overOutRegex.test(type)) {
                        newEvent.relatedTarget = event.relatedTarget
                          || event[(type == 'mouseover' ? 'from' : 'to') + 'Element']
                      }
                      return mouseProps
                    }
                }
              , { // mouse wheel events
                    reg: /mouse.*(wheel|scroll)/i
                  , fix: function () { return mouseWheelProps }
                }
              , { // TextEvent
                    reg: /^text/i
                  , fix: function () { return textProps }
                }
              , { // touch and gesture events
                    reg: /^touch|^gesture/i
                  , fix: function () { return touchProps }
                }
              , { // message events
                    reg: /^message$/i
                  , fix: function () { return messageProps }
                }
              , { // popstate events
                    reg: /^popstate$/i
                  , fix: function () { return stateProps }
                }
              , { // everything else
                    reg: /.*/
                  , fix: function () { return commonProps }
                }
            ]
          , typeFixerMap = {} // used to map event types to fixer functions (above), a basic cache mechanism

          , Event = function (event, element, isNative) {
              if (!arguments.length) return
              event = event || ((element.ownerDocument || element.document || element).parentWindow || win).event
              this.originalEvent = event
              this.isNative       = isNative
              this.isBean         = true

              if (!event) return

              var type   = event.type
                , target = event.target || event.srcElement
                , i, l, p, props, fixer

              this.target = target && target.nodeType === 3 ? target.parentNode : target

              if (isNative) { // we only need basic augmentation on custom events, the rest expensive & pointless
                fixer = typeFixerMap[type]
                if (!fixer) { // haven't encountered this event type before, map a fixer function for it
                  for (i = 0, l = typeFixers.length; i < l; i++) {
                    if (typeFixers[i].reg.test(type)) { // guaranteed to match at least one, last is .*
                      typeFixerMap[type] = fixer = typeFixers[i].fix
                      break
                    }
                  }
                }

                props = fixer(event, this, type)
                for (i = props.length; i--;) {
                  if (!((p = props[i]) in this) && p in event) this[p] = event[p]
                }
              }
            }

        // preventDefault() and stopPropagation() are a consistent interface to those functions
        // on the DOM, stop() is an alias for both of them together
        Event.prototype.preventDefault = function () {
          if (this.originalEvent.preventDefault) this.originalEvent.preventDefault()
          else this.originalEvent.returnValue = false
        }
        Event.prototype.stopPropagation = function () {
          if (this.originalEvent.stopPropagation) this.originalEvent.stopPropagation()
          else this.originalEvent.cancelBubble = true
        }
        Event.prototype.stop = function () {
          this.preventDefault()
          this.stopPropagation()
          this.stopped = true
        }
        // stopImmediatePropagation() has to be handled internally because we manage the event list for
        // each element
        // note that originalElement may be a Bean#Event object in some situations
        Event.prototype.stopImmediatePropagation = function () {
          if (this.originalEvent.stopImmediatePropagation) this.originalEvent.stopImmediatePropagation()
          this.isImmediatePropagationStopped = function () { return true }
        }
        Event.prototype.isImmediatePropagationStopped = function () {
          return this.originalEvent.isImmediatePropagationStopped && this.originalEvent.isImmediatePropagationStopped()
        }
        Event.prototype.clone = function (currentTarget) {
          //TODO: this is ripe for optimisation, new events are *expensive*
          // improving this will speed up delegated events
          var ne = new Event(this, this.element, this.isNative)
          ne.currentTarget = currentTarget
          return ne
        }

        return Event
      }())

      // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
    , targetElement = function (element, isNative) {
        return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
      }

      /**
        * Bean maintains an internal registry for event listeners. We don't touch elements, objects
        * or functions to identify them, instead we store everything in the registry.
        * Each event listener has a RegEntry object, we have one 'registry' for the whole instance.
        */
    , RegEntry = (function () {
        // each handler is wrapped so we can handle delegation and custom events
        var wrappedHandler = function (element, fn, condition, args) {
            var call = function (event, eargs) {
                  return fn.apply(element, args ? slice.call(eargs, event ? 0 : 1).concat(args) : eargs)
                }
              , findTarget = function (event, eventElement) {
                  return fn.__beanDel ? fn.__beanDel.ft(event.target, element) : eventElement
                }
              , handler = condition
                  ? function (event) {
                      var target = findTarget(event, this) // deleated event
                      if (condition.apply(target, arguments)) {
                        if (event) event.currentTarget = target
                        return call(event, arguments)
                      }
                    }
                  : function (event) {
                      if (fn.__beanDel) event = event.clone(findTarget(event)) // delegated event, fix the fix
                      return call(event, arguments)
                    }
            handler.__beanDel = fn.__beanDel
            return handler
          }

        , RegEntry = function (element, type, handler, original, namespaces, args, root) {
            var customType     = customEvents[type]
              , isNative

            if (type == 'unload') {
              // self clean-up
              handler = once(removeListener, element, type, handler, original)
            }

            if (customType) {
              if (customType.condition) {
                handler = wrappedHandler(element, handler, customType.condition, args)
              }
              type = customType.base || type
            }

            this.isNative      = isNative = nativeEvents[type] && !!element[eventSupport]
            this.customType    = !W3C_MODEL && !isNative && type
            this.element       = element
            this.type          = type
            this.original      = original
            this.namespaces    = namespaces
            this.eventType     = W3C_MODEL || isNative ? type : 'propertychange'
            this.target        = targetElement(element, isNative)
            this[eventSupport] = !!this.target[eventSupport]
            this.root          = root
            this.handler       = wrappedHandler(element, handler, null, args)
          }

        // given a list of namespaces, is our entry in any of them?
        RegEntry.prototype.inNamespaces = function (checkNamespaces) {
          var i, j, c = 0
          if (!checkNamespaces) return true
          if (!this.namespaces) return false
          for (i = checkNamespaces.length; i--;) {
            for (j = this.namespaces.length; j--;) {
              if (checkNamespaces[i] == this.namespaces[j]) c++
            }
          }
          return checkNamespaces.length === c
        }

        // match by element, original fn (opt), handler fn (opt)
        RegEntry.prototype.matches = function (checkElement, checkOriginal, checkHandler) {
          return this.element === checkElement &&
            (!checkOriginal || this.original === checkOriginal) &&
            (!checkHandler || this.handler === checkHandler)
        }

        return RegEntry
      }())

    , registry = (function () {
        // our map stores arrays by event type, just because it's better than storing
        // everything in a single array.
        // uses '$' as a prefix for the keys for safety and 'r' as a special prefix for
        // rootListeners so we can look them up fast
        var map = {}

          // generic functional search of our registry for matching listeners,
          // `fn` returns false to break out of the loop
          , forAll = function (element, type, original, handler, root, fn) {
              var pfx = root ? 'r' : '$'
              if (!type || type == '*') {
                // search the whole registry
                for (var t in map) {
                  if (t.charAt(0) == pfx) {
                    forAll(element, t.substr(1), original, handler, root, fn)
                  }
                }
              } else {
                var i = 0, l, list = map[pfx + type], all = element == '*'
                if (!list) return
                for (l = list.length; i < l; i++) {
                  if ((all || list[i].matches(element, original, handler)) && !fn(list[i], list, i, type)) return
                }
              }
            }

          , has = function (element, type, original, root) {
              // we're not using forAll here simply because it's a bit slower and this
              // needs to be fast
              var i, list = map[(root ? 'r' : '$') + type]
              if (list) {
                for (i = list.length; i--;) {
                  if (!list[i].root && list[i].matches(element, original, null)) return true
                }
              }
              return false
            }

          , get = function (element, type, original, root) {
              var entries = []
              forAll(element, type, original, null, root, function (entry) {
                return entries.push(entry)
              })
              return entries
            }

          , put = function (entry) {
              var has = !entry.root && !this.has(entry.element, entry.type, null, false)
                , key = (entry.root ? 'r' : '$') + entry.type
              ;(map[key] || (map[key] = [])).push(entry)
              return has
            }

          , del = function (entry) {
              forAll(entry.element, entry.type, null, entry.handler, entry.root, function (entry, list, i) {
                list.splice(i, 1)
                entry.removed = true
                if (list.length === 0) delete map[(entry.root ? 'r' : '$') + entry.type]
                return false
              })
            }

            // dump all entries, used for onunload
          , entries = function () {
              var t, entries = []
              for (t in map) {
                if (t.charAt(0) == '$') entries = entries.concat(map[t])
              }
              return entries
            }

        return { has: has, get: get, put: put, del: del, entries: entries }
      }())

      // we need a selector engine for delegated events, use querySelectorAll if it exists
      // but for older browsers we need Qwery, Sizzle or similar
    , selectorEngine
    , setSelectorEngine = function (e) {
        if (!arguments.length) {
          selectorEngine = doc.querySelectorAll
            ? function (s, r) {
                return r.querySelectorAll(s)
              }
            : function () {
                throw new Error('Bean: No selector engine installed') // eeek
              }
        } else {
          selectorEngine = e
        }
      }

      // we attach this listener to each DOM event that we need to listen to, only once
      // per event type per DOM element
    , rootListener = function (event, type) {
        if (!W3C_MODEL && type && event && event.propertyName != '_on' + type) return

        var listeners = registry.get(this, type || event.type, null, false)
          , l = listeners.length
          , i = 0

        event = new Event(event, this, true)
        if (type) event.type = type

        // iterate through all handlers registered for this type, calling them unless they have
        // been removed by a previous handler or stopImmediatePropagation() has been called
        for (; i < l && !event.isImmediatePropagationStopped(); i++) {
          if (!listeners[i].removed) listeners[i].handler.call(this, event)
        }
      }

      // add and remove listeners to DOM elements
    , listener = W3C_MODEL
        ? function (element, type, add, custom, useCapture) {
            // new browsers
            element[add ? addEvent : removeEvent](type, rootListener, useCapture)
          }
        : function (element, type, add, custom /*, useCapture */) {
            // IE8 and below, use attachEvent/detachEvent and we have to piggy-back propertychange events
            // to simulate event bubbling etc.
            var entry
            if (add) {
              registry.put(entry = new RegEntry(
                  element
                , custom || type
                , function (event) { // handler
                    rootListener.call(element, event, custom)
                  }
                , rootListener
                , null
                , null
                , true // is root
              ))
              if (custom && element['_on' + custom] == null) element['_on' + custom] = 0
              entry.target.attachEvent('on' + entry.eventType, entry.handler)
            } else {
              entry = registry.get(element, custom || type, rootListener, true)[0]
              if (entry) {
                entry.target.detachEvent('on' + entry.eventType, entry.handler)
                registry.del(entry)
              }
            }
          }

    , once = function (rm, element, type, fn, originalFn) {
        // wrap the handler in a handler that does a remove as well
        return function () {
          fn.apply(this, arguments)
          rm(element, type, originalFn)
        }
      }

    , removeListener = function (element, orgType, handler, namespaces, useCapture) {
        var type     = orgType && orgType.replace(nameRegex, '')
          , handlers = registry.get(element, type, null, false)
          , removed  = {}
          , i, l

        for (i = 0, l = handlers.length; i < l; i++) {
          if ((!handler || handlers[i].original === handler) && handlers[i].inNamespaces(namespaces)) {
            // TODO: this is problematic, we have a registry.get() and registry.del() that
            // both do registry searches so we waste cycles doing this. Needs to be rolled into
            // a single registry.forAll(fn) that removes while finding, but the catch is that
            // we'll be splicing the arrays that we're iterating over. Needs extra tests to
            // make sure we don't screw it up. @rvagg
            registry.del(handlers[i])
            if (!removed[handlers[i].eventType] && handlers[i][eventSupport])
              removed[handlers[i].eventType] = { t: handlers[i].eventType, c: handlers[i].type }
          }
        }
        // check each type/element for removed listeners and remove the rootListener where it's no longer needed
        for (i in removed) {
          if (!registry.has(element, removed[i].t, null, false)) {
            // last listener of this type, remove the rootListener
            listener(element, removed[i].t, false, removed[i].c, useCapture)
          }
        }
      }

      // set up a delegate helper using the given selector, wrap the handler function
    , delegate = function (selector, fn) {
        //TODO: findTarget (therefore $) is called twice, once for match and once for
        // setting e.currentTarget, fix this so it's only needed once
        var findTarget = function (target, root) {
              var i, array = isString(selector) ? selectorEngine(selector, root) : selector
              for (; target && target !== root; target = target.parentNode) {
                for (i = array.length; i--;) {
                  if (array[i] === target) return target
                }
              }
            }
          , handler = function (e) {
              var match = findTarget(e.target, this)
              if (match) fn.apply(match, arguments)
            }

        // __beanDel isn't pleasant but it's a private function, not exposed outside of Bean
        handler.__beanDel = {
            ft       : findTarget // attach it here for customEvents to use too
          , selector : selector
        }
        return handler
      }

    , fireListener = W3C_MODEL ? function (isNative, type, element) {
        // modern browsers, do a proper dispatchEvent()
        var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
        evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
        element.dispatchEvent(evt)
      } : function (isNative, type, element) {
        // old browser use onpropertychange, just increment a custom property to trigger the event
        element = targetElement(element, isNative)
        isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
      }

      /**
        * Public API: off(), on(), add(), (remove()), one(), fire(), clone()
        */

      /**
        * off(element[, eventType(s)[, handler ], options])
        */
    , off = function (element, typeSpec, fn) {
        var isTypeStr = isString(typeSpec),
          defaultOpts = {
            useCapture: false
          }
          , opts = buildOptions(defaultOpts, arguments[arguments.length - 1])
          , k, type, namespaces, i

        if (isTypeStr && typeSpec.indexOf(' ') > 0) {
          // off(el, 't1 t2 t3', fn) or off(el, 't1 t2 t3')
          typeSpec = str2arr(typeSpec)
          for (i = typeSpec.length; i--;)
            off(element, typeSpec[i], fn)
          return element
        }

        type = isTypeStr && typeSpec.replace(nameRegex, '')
        if (type && customEvents[type]) type = customEvents[type].base

        if (!typeSpec || isTypeStr) {
          // off(el) or off(el, t1.ns) or off(el, .ns) or off(el, .ns1.ns2.ns3)
          if (namespaces = isTypeStr && typeSpec.replace(namespaceRegex, '')) namespaces = str2arr(namespaces, '.')
          removeListener(element, type, fn, namespaces, opts.useCapture)
        } else if (isFunction(typeSpec)) {
          // off(el, fn)
          removeListener(element, null, typeSpec, null, opts.useCapture)
        } else {
          // off(el, { t1: fn1, t2, fn2 })
          for (k in typeSpec) {
            if (typeSpec.hasOwnProperty(k)) off(element, k, typeSpec[k])
          }
        }

        return element
      }

      /**
        * on(element, eventType(s)[, selector], handler[, args ], [options])
        */
    , on = function(element, events, selector, fn) {
        var defaultOpts = {
            useCapture: false
          },
          originalFn, type, types, i, args, entry, first, opts

        //TODO: the undefined check means you can't pass an 'args' argument, fix this perhaps?
        if (selector === undefined && typeof events == 'object') {
          //TODO: this can't handle delegated events
          for (type in events) {
            if (events.hasOwnProperty(type)) {
              on.call(this, element, type, events[type])
            }
          }
          return
        }

        if (!isFunction(selector)) {
          // delegated event
          originalFn = fn
          args       = slice.call(arguments, 4)
          fn         = delegate(selector, originalFn, selectorEngine)
        } else {
          args       = slice.call(arguments, 3)
          fn         = originalFn = selector
        }

        opts = buildOptions(defaultOpts, args[args.length - 1])
        types = str2arr(events)

        // special case for one(), wrap in a self-removing handler
        if (this === ONE) {
          fn = once(off, element, events, fn, originalFn)
        }

        for (i = types.length; i--;) {
          // add new handler to the registry and check if it's the first for this element/type
          first = registry.put(entry = new RegEntry(
              element
            , types[i].replace(nameRegex, '') // event type
            , fn
            , originalFn
            , str2arr(types[i].replace(namespaceRegex, ''), '.') // namespaces
            , args
            , false // not root
          ))
          if (entry[eventSupport] && first) {
            // first event of this type on this element, add root listener
            listener(element, entry.eventType, true, entry.customType, opts.useCapture)
          }
        }

        return element
      }

      /**
        * add(element[, selector], eventType(s), handler[, args ])
        *
        * Deprecated: kept (for now) for backward-compatibility
        */
    , add = function (element, events, fn, delfn, options) {
        return on.apply(
            null
          , !isString(fn)
              ? slice.call(arguments)
              : [ element, fn, events, delfn ].concat(arguments.length > 3 ? slice.call(arguments, 4) : [])
        )
      }

      /**
        * one(element, eventType(s)[, selector], handler[, args ])
        */
    , one = function () {
        return on.apply(ONE, arguments)
      }

      /**
        * fire(element, eventType(s)[, args ])
        *
        * The optional 'args' argument must be an array, if no 'args' argument is provided
        * then we can use the browser's DOM event system, otherwise we trigger handlers manually
        */
    , fire = function (element, type, args) {
        var types = str2arr(type)
          , i, j, l, names, handlers

        for (i = types.length; i--;) {
          type = types[i].replace(nameRegex, '')
          if (names = types[i].replace(namespaceRegex, '')) names = str2arr(names, '.')
          if (!names && !args && element[eventSupport]) {
            fireListener(nativeEvents[type], type, element)
          } else {
            // non-native event, either because of a namespace, arguments or a non DOM element
            // iterate over all listeners and manually 'fire'
            handlers = registry.get(element, type, null, false)
            args = [false].concat(args)
            for (j = 0, l = handlers.length; j < l; j++) {
              if (handlers[j].inNamespaces(names)) {
                handlers[j].handler.apply(element, args)
              }
            }
          }
        }
        return element
      }

      /**
        * clone(dstElement, srcElement[, eventType ])
        *
        * TODO: perhaps for consistency we should allow the same flexibility in type specifiers?
        */
    , clone = function (element, from, type) {
        var handlers = registry.get(from, type, null, false)
          , l = handlers.length
          , i = 0
          , args, beanDel

        for (; i < l; i++) {
          if (handlers[i].original) {
            args = [ element, handlers[i].type ]
            if (beanDel = handlers[i].handler.__beanDel) args.push(beanDel.selector)
            args.push(handlers[i].original)
            on.apply(null, args)
          }
        }
        return element
      }

    , bean = {
          'on'                : on
        , 'add'               : add
        , 'one'               : one
        , 'off'               : off
        , 'remove'            : off
        , 'clone'             : clone
        , 'fire'              : fire
        , 'Event'             : Event
        , 'setSelectorEngine' : setSelectorEngine
        , 'noConflict'        : function () {
            context[name] = old
            return this
          }
      }

  // for IE, clean up on unload to avoid leaks
  if (win.attachEvent) {
    var cleanup = function () {
      var i, entries = registry.entries()
      for (i in entries) {
        if (entries[i].type && entries[i].type !== 'unload') off(entries[i].element, entries[i].type)
      }
      win.detachEvent('onunload', cleanup)
      win.CollectGarbage && win.CollectGarbage()
    }
    win.attachEvent('onunload', cleanup)
  }

  // initialize selector engine to internal default (qSA or throw Error)
  setSelectorEngine()

  return bean
});

},{}],3:[function(require,module,exports){
require( './lib/shims/custom-event' )

var bean = require( '@spark-engine/bean' ),
    key  = require( 'keymaster' ),
    afterAnimation    = require( './lib/after-animation' ),
    page              = require( './lib/page' ),
    tap               = require( './lib/tap-events' ),
    debounce          = require( './lib/debounce' ),
    throttle          = require( './lib/throttle' ),
    delay             = require( './lib/delay' ),
    repeat            = require( './lib/repeat' ),
    bubbleFormEvents  = require( './lib/bubble-form-events' ),
    submit            = require( './lib/submit' ),
    scroll            = require( './lib/scroll' ),
    resize            = require( './lib/resize' ),
    callbackManager   = require( './lib/callback-manager' ),
    eventManager      = require( './lib/event-manager' ),
    media             = require( './lib/media' ),

    slice             = Array.prototype.slice,
    formBubbling      = false,
    watchAnimation    = true

module.exports = {

  // DOM events
  on: bean.on,
  off: bean.off,
  one: bean.one,
  fire: bean.fire,
  clone: bean.clone,
  ready: page.ready,
  change: page.change,
  afterAnimation: afterAnimation,
  watchAnimation: watchAnimation,

  // Media query events
  media: media,

  // Keyboard events
  key: key,
  keyOn: key,
  keyOff: key.unbind,
  keyOne: keyOne,

  // Timing utilities
  debounce: debounce,
  throttle: throttle,
  delay:    delay,
  repeat:   repeat,

  // Optimized Event Managers
  scroll:      scroll,
  resize:      resize,
  eventManager: eventManager,

  callbackManager: callbackManager,
  callback: callbackManager.callback,

  // Bubbling fix
  bubbleFormEvents: bubbleFormEvents,

  submit: submit
}

page.ready( function() {
  if ( watchAnimation ) afterAnimation.watch()
})

// Add support for unbinding a key event after it is called
//
function keyOne ( keys, scope, fn ) {

  if ( typeof scope == 'function' ) {
    fn = scope
    scope = 'all'
  }

  key( keys, scope, function( event ) {
    key.unbind( keys, scope )
    fn( event )
  })
}

},{"./lib/after-animation":4,"./lib/bubble-form-events":5,"./lib/callback-manager":6,"./lib/debounce":7,"./lib/delay":8,"./lib/event-manager":9,"./lib/media":10,"./lib/page":11,"./lib/repeat":12,"./lib/resize":13,"./lib/scroll":14,"./lib/shims/custom-event":15,"./lib/submit":16,"./lib/tap-events":17,"./lib/throttle":18,"@spark-engine/bean":2,"keymaster":19}],4:[function(require,module,exports){
var Event     = require( '@spark-engine/bean' ),
    delay     = require( './delay' )

function animationDuration( el ) {
  return window.getComputedStyle( el ).getPropertyValue( 'animation-duration' )
}

// Watches all document animation and adds data attributes to elements when they begin
// This enables animationEnd to watch animations which haven't begun
function watchAnimation() {
  Event.on( document, 'animationstart', function( event ) {
    event.target.dataset.isAnimating = true
  })
  Event.on( document, 'animationend', function( event ) {
    event.target.removeAttribute('data-is-animating')
  })
}

// This requires trackElementAnimation to be enabled
function afterAnimation( el, callback, startTimeout ) {
  // Animation has already begun
  if ( el.dataset.isAnimating || el.querySelector( '[data-is-animating]' ) ) {

    // Watch for end
    Event.one( el, 'animationend', callback )

  // Animation has not yet begun so…
  } else {

    // startTimeout is meant to ensure that a callback is fired even if 
    // an animation event, or in the case that an animation event is never triggered
    // this might happen if a user wants to fire a callack after an element animates
    // or fire the callback anyway if the element doesn't have an animation.
    if ( startTimeout ) {

      // Set a default timeout (allowing startTimeout == true or a specified number of milisecons)
      var time = ((typeof startTimeout == "number") ? startTimeout : 32) // 32ms: ~ two frames of animation grace period

      var delayedEvent = delay( function() {
        // Stop watching for animation to start
        // Why? - If the animation starts later, the callback will fire twice
        Event.off( el, 'animationstart', watchEndEvent ) 
        callback()
      }, time )
    }

    // Next:
    // Register a function to attach callback to animationEnd event
    function watchEndEvent () {
      if ( startTimeout ) delayedEvent.stop()    // cancel delayed fire
      Event.one( el, 'animationend', callback ) // watch for animation to finish
    }
    
    // Finally, when the animation does start, watch for its end
    Event.one( el, 'animationstart', watchEndEvent )
  }
}

afterAnimation.watch = watchAnimation

module.exports = afterAnimation

},{"./delay":8,"@spark-engine/bean":2}],5:[function(require,module,exports){
var Event = require( '@spark-engine/bean' ),
    page  = require( './page' ),
    formEls;

var formBubbling = false

var fireBubble = function ( event ) {
  if ( event.detail && event.detail.triggered ) { return false }

  var ev = new CustomEvent( event.type, { bubbles: true, cancelable: true, detail: { triggered: true } } )

  // Stop only 'submit' events. Stopping blur or foucs events seems to break FireFox input interactions.
  if ( event.type == 'submit' ) event.stopImmediatePropagation()

  event.target.dispatchEvent( ev )

  // Prevent default on original event if custom event is prevented
  if ( ev.defaultPrevented ) event.preventDefault() 
}

// Simplify setting the event type based on the element
var eventType = function ( el ) {
  return ( el.tagName == 'FORM' ) ? 'submit' : 'focus blur'
}

// Add event listeners
var bubbleOn = function ( el ) {
  Event.on( el, eventType( el ), fireBubble )
}

// Remove event listeners
var bubbleOff = function ( el ) {
  Event.off( el, eventType( el ), fireBubble )
}

// Add/Remove event listeners
var bubbleFormEvents = function () {
  if ( formBubbling ) { return } 
  page.change( function() {

    // Remove listeners from previous page
    if ( formEls ) Array.prototype.forEach.call( formEls, bubbleOff )

    // Add new listeners to this page
    formEls = document.querySelectorAll( 'form, input' )

    Array.prototype.forEach.call( formEls, bubbleOn )
  })

  var formBubbling = true
}

module.exports = bubbleFormEvents

},{"./page":11,"@spark-engine/bean":2}],6:[function(require,module,exports){
var Manager = {
  new: function() {
    var manager = {

      callbacks: [],

      add: function( fn ) {
        var cb = Manager.callback.new( fn )
        manager.callbacks.push( cb )
        return cb
      },

      stop: function() {
        manager.callbacks.forEach( function( cb ) { cb.stop() } )
      },

      start: function() {
        manager.callbacks.forEach( function( cb ) { cb.start() } )
      },

      toggle: function( bool ) {
        manager.callbacks.forEach( function( cb ) { cb.toggle( bool ) } )
      },

      remove: function() {
        manager.callbacks = []
      },

      fire: function() {
        var args = Array.prototype.slice.call( arguments )
        manager.callbacks.forEach( function( fn ) { fn.apply( this, args ) } )
      }
    }

    return manager
  },

  callback: {
    new: function( fn ) {
      var cb = function() {
        if ( cb.enabled ) { fn.apply( fn, arguments ) }
      }

      cb.stop   = function() { cb.enabled = false }
      cb.start  = function() { cb.enabled = true }
      cb.toggle = function( bool ) {
        cb.enabled = ( 0 in arguments ) ? bool : !cb.enabled
      }
      cb.enabled = true

      return cb
    }
  }
}

module.exports = Manager

},{}],7:[function(require,module,exports){
var now = function() {
  return Date.now()
}

var pickFunction = function() {
  var found
  Array.prototype.forEach.call( arguments, function( candidate ) {
    if ( typeof( candidate ) == 'function' && !found ) { found = candidate }
  })

  return found
}

var debounce = function( fn, wait, options ) {

  // Allow options passed as the first argument
  if ( typeof( fn ) == 'object' ) { options = fn } 

  // Options won't be null
  else { options = options || {} }

  wait = options.wait || wait || 0

  var max            = options.max || false,
      leading        = ( ( 'leading'  in options ) ? options.leading  : false ),
      trailing       = ( ( 'trailing' in options ) ? options.trailing : true ),
      
      // Grab functions from options or default to first argument
      leadingFn      = pickFunction( options.leading, options.trailing, options.callback, fn ),
      trailingFn     = pickFunction( options.trailing, options.leading, options.callback, fn ),

      // State tracking vars
      args,                    // Track arguments passed to debounced callback
      queued         = false,  // Has a callback been added to the animation loop?
      handle         = {},     // Object for tracking functions and callbacks
      lastCalled     = 0,      // Keep a timer for debouncing
      lastInvoked    = 0,      // Keep a timer for max
      leadingBlocked = false;  // Track leading, throttling subsequent leading calls

  // Queue the function with requestAnimationFrame
  var invoke = function( callType ) {

    lastCalled = now()
    lastInvoked = now()
    queued = false
    leadingBlocked = true

    if ( callType === 'leading' ) {
      leadingFn.apply( leadingFn, args ) }
    else {
      trailingFn.apply( trailingFn, args ) }

  }

  // Load the loop into the animation queue
  var addToQueue = function () {

    if ( !queued ) {
      queued = true
      handle.value = requestAnimationFrame( loop )  // Add to browser's animation queue
    }

  }

  // Remove from animation queue and reset debounce 
  var removeFromQueue = function() {

    if ( "value" in handle ) {
      cancelAnimationFrame( handle.value )
      queued         = false
      lastCalled     = 0
      lastInvoked    = 0
      leadingBlocked = false
    }
    
  }

  // prevent infinite debouncing ( if options.max is set )
  var maxPassed = function() {
    return ( max && now() - lastInvoked >= max )
  }

  var waitReached = function() {
    return ( now() - lastCalled ) >= wait
  }

  // This gets loaded into the animation queue and determines whether to ivoke the debounced function
  var loop = function () {
  
    // Loop was executed so it's no longer in the animation queue
    queued = false
    
    if ( leading && !leadingBlocked ) {
      invoke( 'leading' )
    }

    // If function has been called to frequently to execute
    else if ( maxPassed() ) {

      if ( leading ) { invoke( 'leading' )  }
      else           { invoke( 'trailing' ) }

    } 
    
    // If function hasn't been called since last wait
    else if ( waitReached() ) {

      // If trailing it's safe to invoke
      if ( trailing ) { invoke( 'trailing' ) }

      // If leading, it's safe to remove block
      if ( leading )  { leadingBlocked = false }
     
    } else {
      addToQueue()
    }

  }

  // A wrapper function for queueing up function calls
  //
  var debounced = function() {
    lastCalled = now()
    args = arguments
    addToQueue()
  }

  debounced.stop = removeFromQueue

  return debounced
}

module.exports = debounce

},{}],8:[function(require,module,exports){
var now = function() {
  return Date.now()
}

var delay = function ( fn, wait ) {

  var argsStart = ( wait != null ) ? 2 : 1;
  var handle = {}

  handle.args  = Array.prototype.slice.call( arguments, argsStart )
  handle.wait  = wait || 0
  handle.start = now()

  handle.stop  = function () {
    if ( "value" in handle ) {
      cancelAnimationFrame( handle.value );
    }
  }

  handle.loop  = function () {

    // If wait limit has been reached
    if ( now() - handle.start >= handle.wait ) {
      fn.apply( fn, handle.args )

      // If repeat is set and is not 0
      if ( !!handle.repeat ) {
        handle.repeat = handle.repeat - 1
        handle.start = now()
        queueDelay( handle )
      } else if ( handle.repeat === 0 && handle.complete ) {
        handle.complete()
      }

    } else {
      queueDelay( handle )
    }

  }


  return queueDelay( handle )
}

var queueDelay = function ( handle ) {
  handle.value = requestAnimationFrame( handle.loop )
  return handle
}

module.exports = delay

},{}],9:[function(require,module,exports){
var Event           = require( '@spark-engine/bean' )
var Page            = require( './page' )
var callbackManager = require( './callback-manager' )
var throttle        = require( './throttle' )
var debounce        = require( './debounce' )

var eventManager = {
  new: function( name, options ) {

    options = options || {}
    var target = options.target || window
    var delay = options.delay || 150
    var optimize = options.throttle || true

    // Create a new callback manager
    var manager = {
      run: callbackManager.new(),
      start: callbackManager.new(),
      end: callbackManager.new()
    }

    var running = manager.run.fire

    // run callbacks when event happens (at paint-ready frames)
    if (optimize) running = throttle( running )

    // fire callbacks when event starts (at paint-ready frames)
    var started = debounce({ leading: manager.start.fire, trailing: false, wait: delay })

    // fire callbacks when event starts (at paint-ready frames)
    var ended = debounce( manager.end.fire, delay )

    // Public API
    var run   = function ( fn ) { return manager.run.add( fn ) }
    run.start = function ( fn ) { return manager.start.add( fn ) }
    run.end   = function ( fn ) { return manager.end.add( fn ) }

    Page.ready(function(){
      if ( typeof target === "string" ) target = document.querySelector(target)

      if ( target ) {
        // These functions use throttle and debounce to only trigger on optimzied intervals and at start and end
        Event.on( target, name, function(event) {
          started(event)
          running(event)
          ended(event)
        })
      }
    })

    return run
  }
}

module.exports = eventManager

},{"./callback-manager":6,"./debounce":7,"./page":11,"./throttle":18,"@spark-engine/bean":2}],10:[function(require,module,exports){
// This simplifies common uses for window.matchMedia 
// namely, adding listeners for width and height queries

function parseQuery( query, dimension ) {
  var result = {}

  if ( typeof( query ) === 'string' ) { return query }

  result.min = size( query.min, 'min-' + dimension )
  result.max = size( query.max, 'max-' + dimension )

  if ( result.min && result.max )
    result.query = result.min + ' and ' + result.max

  return result.query || result.min || result.max
}

function size( num, limit ) {
  return ( num ) ? '('+limit+': ' + toPx( num ) + ')' : null
}

function toPx( width ) {
  if ( typeof( width ) === 'number' ) { return width + 'px'}
  return width
}

var media = {

  width: function( query, fn ) {
    return media.listen( parseQuery( query, 'width' ), fn )
  },

  minWidth: function( size, fn ) { return media.width( { min: size }, fn ) },
  maxWidth: function( size, fn ) { return media.width( { max: size }, fn ) },

  height: function( query, fn ) {
    return media.listen( parseQuery( query, 'height' ), fn )
  },

  minHeight: function( size, fn ) { return media.height( { min: size }, fn ) },
  maxHeight: function( size, fn ) { return media.height( { max: size }, fn ) },

  listen: function( query, fn ) {
    var match = window.matchMedia( query )

    if ( fn ) {
      fn( match )
      match.addListener( fn )
    }

    return match
  }

}


module.exports = media

},{}],11:[function(require,module,exports){
var Event           = require( '@spark-engine/bean' )
var callbackManager = require( './callback-manager' )

// Create a new page event manager
var manager = {
  ready: callbackManager.new(),
  change: callbackManager.new(),
  readyAlready: false,
  changed: false,
}

manager.ready.add( function(){
  manager.readyAlready = true 
})

manager.ready.add( function(){ 
  if ( !window.Turbolinks && !manager.changed ) { 
    manager.changed = true 
    manager.change.fire()
  }
})

var ready = function ( fn ) {
  if ( manager.readyAlready ) { fn() }
  return manager.ready.add( fn ) }

var change = function( fn ) {
  if ( manager.changed ) { fn() }
  return manager.change.add( fn ) }

// Make it easy to trigger ready callbacks
ready.fire = function () {
  manager.ready.fire()
  // Be sure ready can only be fired once
  manager.ready.stop() }

// Make it easy to trigger change callbacks
change.fire = function () {
  manager.change.fire() }

Event.on( document, 'DOMContentLoaded', ready.fire )
Event.on( document, 'page:change turbolinks:load', change.fire ) // Support custom and rails turbolinks page load events

module.exports = {
  ready: ready,
  change: change
}

},{"./callback-manager":6,"@spark-engine/bean":2}],12:[function(require,module,exports){
var delay = require( './delay' )

var repeat = function( fn, wait, limit ) {

  var argsStart = 1,
      handle = delay ( fn, wait );

  if      ( limit != null ) { argsStart = 3 }
  else if ( wait  != null ) { argsStart = 2 }

  // Enable repeat ( -1 will repeat forever )
  handle.repeat = limit || -1
  handle.args   = Array.prototype.slice.call( arguments, argsStart )
  handle.stop   = handle.cancel

  return handle
}

module.exports = repeat

},{"./delay":8}],13:[function(require,module,exports){
var manager = require( './event-manager' )
var resize  = manager.new( 'resize' )

// Pause animations during resizing for better performance
resize.disableAnimation = function() {
  var style = '<style id="fullstop">.no-animation *, .no-animation *:after, .no-animation *:before {\
    transition: none !important; animation: none !important\
  }</style>'

  // Inject style for easy classname manipulation
  if ( !document.querySelector('style#fullstop') ) { 
    document.head.insertAdjacentHTML('beforeend', style)
  }

  resize.start( function() { document.body.classList.add( 'no-animation' ) } )
  resize.end( function() {  document.body.classList.remove( 'no-animation' ) } )
}

module.exports = resize

},{"./event-manager":9}],14:[function(require,module,exports){
var manager = require( './event-manager' )
var scroll  = manager.new( 'scroll' )

scroll.disablePointer = function() {

  // Disable pointer interaction
  scroll.start( function() {
    document.documentElement.style.pointerEvents = 'none'
  })

  // Enable pointer interaction
  scroll.end( function() {
    document.documentElement.style.pointerEvents = ''
  })
}

module.exports = scroll

},{"./event-manager":9}],15:[function(require,module,exports){
// Custom Event Polyfill
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  CustomEvent.prototype = window.Event.prototype;

  window.CustomEvent = CustomEvent;
})()

},{}],16:[function(require,module,exports){
// Manually trigger a cancelable form submit event.
function submit( form ) {
  if ( !form.tagName || form.tagName != 'FORM' ) {
    return console.error( 'Trigger this event on a form element' )
  }

  var ev = new CustomEvent( 'submit', { bubbles: true, cancelable: true, detail: { triggered: true } } )
  form.dispatchEvent( ev )

  // Submit form unless event default is prevented
  if ( !ev.defaultPrevented ) form.submit()
}

module.exports = submit

},{}],17:[function(require,module,exports){
var endEvents = [
  'touchend'
]

module.exports = Tap

// default tap timeout in ms
Tap.timeout = 200

function Tap(callback, options) {
  options = options || {}
  // if the user holds his/her finger down for more than 200ms,
  // then it's not really considered a tap.
  // however, you can make this configurable.
  var timeout = options.timeout || Tap.timeout

  // to keep track of the original listener
  listener.handler = callback

  return listener

  // el.addEventListener('touchstart', listener)
  function listener(e1) {
    // tap should only happen with a single finger
    if (!e1.touches || e1.touches.length > 1) return

    var el = e1.target
    var context = this
    var args = arguments;

    var timeout_id = setTimeout(cleanup, timeout)

    el.addEventListener('touchmove', cleanup)

    endEvents.forEach(function (event) {
      el.addEventListener(event, done)
    })

    function done(e2) {
      // since touchstart is added on the same tick
      // and because of bubbling,
      // it'll execute this on the same touchstart.
      // this filters out the same touchstart event.
      if (e1 === e2) return

      cleanup()

      // already handled
      if (e2.defaultPrevented) return

      // overwrite these functions so that they all to both start and events.
      var preventDefault = e1.preventDefault
      var stopPropagation = e1.stopPropagation

      e1.stopPropagation = function () {
        stopPropagation.call(e1)
        stopPropagation.call(e2)
      }

      e1.preventDefault = function () {
        preventDefault.call(e1)
        preventDefault.call(e2)
      }

      // calls the handler with the `end` event,
      // but i don't think it matters.
      callback.apply(context, args)
    }

    // cleanup end events
    // to cancel the tap, just run this early
    function cleanup(e2) {
      // if it's the same event as the origin,
      // then don't actually cleanup.
      // hit issues with this - don't remember
      if (e1 === e2) return

      clearTimeout(timeout_id)

      el.removeEventListener('touchmove', cleanup)

      endEvents.forEach(function (event) {
        el.removeEventListener(event, done)
      })
    }
  }
}

},{}],18:[function(require,module,exports){
var debounce = require( './debounce' )

var throttle = function( fn, wait, options ) {

  if ( typeof( fn ) == 'object' ) { options = fn; fn = undefined } 
  else { options = options || {} }

  options.wait = options.wait || wait || 0
  options.max  = options.max || options.wait
  options.callback = options.callback || fn
  options.leading  = true
  options.trailing = true

  return debounce(options)
}


module.exports = throttle

},{"./debounce":7}],19:[function(require,module,exports){
//     keymaster.js
//     (c) 2011-2013 Thomas Fuchs
//     keymaster.js may be freely distributed under the MIT license.

;(function(global){
  var k,
    _handlers = {},
    _mods = { 16: false, 18: false, 17: false, 91: false },
    _scope = 'all',
    // modifier keys
    _MODIFIERS = {
      '⇧': 16, shift: 16,
      '⌥': 18, alt: 18, option: 18,
      '⌃': 17, ctrl: 17, control: 17,
      '⌘': 91, command: 91
    },
    // special keys
    _MAP = {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      home: 36, end: 35,
      pageup: 33, pagedown: 34,
      ',': 188, '.': 190, '/': 191,
      '`': 192, '-': 189, '=': 187,
      ';': 186, '\'': 222,
      '[': 219, ']': 221, '\\': 220
    },
    code = function(x){
      return _MAP[x] || x.toUpperCase().charCodeAt(0);
    },
    _downKeys = [];

  for(k=1;k<20;k++) _MAP['f'+k] = 111+k;

  // IE doesn't support Array#indexOf, so have a simple replacement
  function index(array, item){
    var i = array.length;
    while(i--) if(array[i]===item) return i;
    return -1;
  }

  // for comparing mods before unassignment
  function compareArray(a1, a2) {
    if (a1.length != a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) return false;
    }
    return true;
  }

  var modifierMap = {
      16:'shiftKey',
      18:'altKey',
      17:'ctrlKey',
      91:'metaKey'
  };
  function updateModifierKey(event) {
      for(k in _mods) _mods[k] = event[modifierMap[k]];
  };

  // handle keydown event
  function dispatch(event) {
    var key, handler, k, i, modifiersMatch, scope;
    key = event.keyCode;

    if (index(_downKeys, key) == -1) {
        _downKeys.push(key);
    }

    // if a modifier key, set the key.<modifierkeyname> property to true and return
    if(key == 93 || key == 224) key = 91; // right command on webkit, command on Gecko
    if(key in _mods) {
      _mods[key] = true;
      // 'assignKey' from inside this closure is exported to window.key
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = true;
      return;
    }
    updateModifierKey(event);

    // see if we need to ignore the keypress (filter() can can be overridden)
    // by default ignore key presses if a select, textarea, or input is focused
    if(!assignKey.filter.call(this, event)) return;

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers)) return;

    scope = getScope();

    // for each potential shortcut
    for (i = 0; i < _handlers[key].length; i++) {
      handler = _handlers[key][i];

      // see if it's in the current scope
      if(handler.scope == scope || handler.scope == 'all'){
        // check if modifiers match if any
        modifiersMatch = handler.mods.length > 0;
        for(k in _mods)
          if((!_mods[k] && index(handler.mods, +k) > -1) ||
            (_mods[k] && index(handler.mods, +k) == -1)) modifiersMatch = false;
        // call the handler and stop the event if neccessary
        if((handler.mods.length == 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) || modifiersMatch){
          if(handler.method(event, handler)===false){
            if(event.preventDefault) event.preventDefault();
              else event.returnValue = false;
            if(event.stopPropagation) event.stopPropagation();
            if(event.cancelBubble) event.cancelBubble = true;
          }
        }
      }
    }
  };

  // unset modifier keys on keyup
  function clearModifier(event){
    var key = event.keyCode, k,
        i = index(_downKeys, key);

    // remove key from _downKeys
    if (i >= 0) {
        _downKeys.splice(i, 1);
    }

    if(key == 93 || key == 224) key = 91;
    if(key in _mods) {
      _mods[key] = false;
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = false;
    }
  };

  function resetModifiers() {
    for(k in _mods) _mods[k] = false;
    for(k in _MODIFIERS) assignKey[k] = false;
  };

  // parse and assign shortcut
  function assignKey(key, scope, method){
    var keys, mods;
    keys = getKeys(key);
    if (method === undefined) {
      method = scope;
      scope = 'all';
    }

    // for each shortcut
    for (var i = 0; i < keys.length; i++) {
      // set modifier keys if any
      mods = [];
      key = keys[i].split('+');
      if (key.length > 1){
        mods = getMods(key);
        key = [key[key.length-1]];
      }
      // convert to keycode and...
      key = key[0]
      key = code(key);
      // ...store handler
      if (!(key in _handlers)) _handlers[key] = [];
      _handlers[key].push({ shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods });
    }
  };

  // unbind all handlers for given key in current scope
  function unbindKey(key, scope) {
    var multipleKeys, keys,
      mods = [],
      i, j, obj;

    multipleKeys = getKeys(key);

    for (j = 0; j < multipleKeys.length; j++) {
      keys = multipleKeys[j].split('+');

      if (keys.length > 1) {
        mods = getMods(keys);
        key = keys[keys.length - 1];
      }

      key = code(key);

      if (scope === undefined) {
        scope = getScope();
      }
      if (!_handlers[key]) {
        return;
      }
      for (i = 0; i < _handlers[key].length; i++) {
        obj = _handlers[key][i];
        // only clear handlers if correct scope and mods match
        if (obj.scope === scope && compareArray(obj.mods, mods)) {
          _handlers[key][i] = {};
        }
      }
    }
  };

  // Returns true if the key with code 'keyCode' is currently down
  // Converts strings into key codes.
  function isPressed(keyCode) {
      if (typeof(keyCode)=='string') {
        keyCode = code(keyCode);
      }
      return index(_downKeys, keyCode) != -1;
  }

  function getPressedKeyCodes() {
      return _downKeys.slice(0);
  }

  function filter(event){
    var tagName = (event.target || event.srcElement).tagName;
    // ignore keypressed in any elements that support keyboard data input
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  }

  // initialize key.<modifier> to false
  for(k in _MODIFIERS) assignKey[k] = false;

  // set current scope (default 'all')
  function setScope(scope){ _scope = scope || 'all' };
  function getScope(){ return _scope || 'all' };

  // delete all handlers for a given scope
  function deleteScope(scope){
    var key, handlers, i;

    for (key in _handlers) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length; ) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);
        else i++;
      }
    }
  };

  // abstract key logic for assign and unassign
  function getKeys(key) {
    var keys;
    key = key.replace(/\s/g, '');
    keys = key.split(',');
    if ((keys[keys.length - 1]) == '') {
      keys[keys.length - 2] += ',';
    }
    return keys;
  }

  // abstract mods logic for assign and unassign
  function getMods(key) {
    var mods = key.slice(0, key.length - 1);
    for (var mi = 0; mi < mods.length; mi++)
    mods[mi] = _MODIFIERS[mods[mi]];
    return mods;
  }

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', function(event) { dispatch(event) }); // Passing _scope to a callback to ensure it remains the same by execution. Fixes #48
  addEvent(document, 'keyup', clearModifier);

  // reset modifiers to false whenever the window is (re)focused.
  addEvent(window, 'focus', resetModifiers);

  // store previously defined key
  var previousKey = global.key;

  // restore previously defined key and return reference to our key object
  function noConflict() {
    var k = global.key;
    global.key = previousKey;
    return k;
  }

  // set window.key and window.key.set/get/deleteScope, and the default filter
  global.key = assignKey;
  global.key.setScope = setScope;
  global.key.getScope = getScope;
  global.key.deleteScope = deleteScope;
  global.key.filter = filter;
  global.key.isPressed = isPressed;
  global.key.getPressedKeyCodes = getPressedKeyCodes;
  global.key.noConflict = noConflict;
  global.key.unbind = unbindKey;

  if(typeof module !== 'undefined') module.exports = assignKey;

})(this);

},{}],20:[function(require,module,exports){
window.Toggler = module.exports = require('../index.js')

},{"../index.js":1}]},{},[20]);
