var Event = require('compose-event')

var Toggler = {
  checkboxSelector: "[type=checkbox][data-toggle], [type=checkbox][data-show], [type=checkbox][data-hide]",
  radioSelector: "input[type=radio][data-show], input[type=radio][data-hide], input[type=radio][data-add-class], input[type=radio][data-remove-class]",
  selectSelector: "option[data-hide], option[data-show]",

  listen: function(){
    Event.on(document, "click change", "[data-toggle], [data-show], [data-hide], [data-toggle-class], [data-add-class], [data-remove-class]", Toggler.trigger)
    Event.on(document, "change", ".select-toggler", Toggler.trigger)
  },

  refresh: function(){
    Toggler.toggleCheckboxes()
    Toggler.setupSelects()
    Toggler.setupRadios()
  },

  trigger: function(event) {
    // Stop event and bubbling if link is only being used as a toggler
    if (event.currentTarget.getAttribute('href') == "#") {
      event.preventDefault()
      event.stop()
    } 

    Toggler.triggerToggling(event.currentTarget)
  },

  triggerToggling: function(target) {
    var actions = ['hide', 'toggle', 'show', 'removeClass', 'toggleClass', 'addClass']
    var select

    // Store the select, and set the target to the current option
    // Events fire on the select, but the options have toggling attributes
    if (target.tagName.match(/select/i)) {
      select = target
      target = select.selectedOptions[0]
    }

    // Radio inputs and selects do not support toggling, so remove them
    if (select || target.type == 'radio') {
      actions = actions.filter(function(action) {
        return !action.match(/toggle/)
      })
    }

    // Dispatch all actions
    actions.forEach(function(action) {
      Toggler.dispatch(target, action)
    })
  },

  dispatch: function(el, type) {
    var action = type
    var data = el.dataset[type]

    // Abort if element doesn't have data for the action
    if (!data || typeof data == 'undefined' || data == '') return

    // Toggle and show are treated the same for checkboxes
    if (el.type == 'checkbox')
      action = (type.match(/hide|remove/i) ? !el.checked : el.checked)

    if (data){
      if (type.match(/class/i)){
        Toggler.setClass(data, action, el)
      } else {
        Toggler.setState(data, action)
      }
    }
  },

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

  setClass: function (selectors, action, el){
    if(typeof selectors == 'undefined' || selectors == '') return

    if (typeof(action) == 'boolean') {
      action = (action ? 'add' : 'remove')
    }

    if (selectors.match(/&/)) {
      selectors.split('&').forEach(function(sel){
        Toggler.setClass(sel.trim(), action, el) 
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
      matches = [Toggler.getSelectFromOption(el)]
      
    // If no slectors are present, use the current el for classnames
    } else if (el) {
      matches = [el]
    }

    Array.prototype.forEach.call(matches, function(match){
      Array.prototype.forEach.call(classnames.split(' '), function(classname) {
        var method = action.replace(/Class/,'')
        match.classList[method](classname)
      })

      Toggler.triggerTogglerEventsOnChildren(match, 'class')
    })
  },

  setState: function(selectors, state) {
    var matches = document.querySelectorAll(selectors)

    Array.prototype.forEach.call(matches, function(match){
      var action = Toggler.toggleAction(match, state)

      Toggler[action](match)
      Toggler.triggerTogglerEventsOnChildren(match, action)
    })
  },

  toggleAction: function(el, action) {

    if (typeof(action) == 'boolean') {
      action = (action ? 'show' : 'hide')
    }

    if (action == 'toggle') {
      if (el.classList.contains('hidden')) {
        action = 'show'
      } else {
        action = 'hide'
      }
    }

    return action
  },

  show: function(el) {
    el.classList.remove('hidden')
    el.classList.add('visible')

    // Enable inputs, fieldsets or forms when shown
    if ( typeof el.disabled != 'undefined' ){
      el.disabled = false
    }

    // Focus on key element if an element expects focus
    var focusEl = el.querySelector('[data-focus]')
    if (focusEl) { focusEl.focus() }

    // Trigger input event on ranges that have been hidden
    var ranges = el.querySelectorAll('[type=range]')
  },

  hide: function(el) {
    el.classList.remove('visible')
    el.classList.add('hidden')

    // Disable inputs, fieldsets or forms when hidden
    if ( typeof el.disabled != 'undefined' ){
      el.disabled = true
    }
  },

  getLeafNodes: function (parent) {
    // is the parent itself a leaf node?
    if (!parent.hasChildNodes()) return [parent]

    var nodes = Array.prototype.slice.call(parent.getElementsByTagName("*"), 0)

    return nodes.filter(function(elem) {
      return elem.children && elem.children.length === 0
    })
  },

  triggerTogglerEventsOnChildren: function(el, eventName){
    // we care about leaf nodes since the event will bubble to
    // non-leaf nodes from the leaf nodes
    var leafChildNodes = Toggler.getLeafNodes(el)

    Array.prototype.forEach.call(leafChildNodes, function(node) {
      // 'toggler:show', 'toggler:hide', etc
      Event.fire(node, "toggler:" + eventName)
    })
  },

  toggleCheckboxes: function(checkboxes) {
    checkboxes = checkboxes || document.querySelectorAll(Toggler.checkboxSelector)

    Array.prototype.forEach.call(checkboxes, Toggler.triggerToggling)
  },

  setupRadios: function() {
    Array.prototype.forEach.call(document.querySelectorAll(Toggler.radioSelector), function(radio, index){
      if (!radio.dataset.togglerActive) {

        var radioName         = radio.getAttribute('name'),
            siblings          = Toggler.parentForm(radio).querySelectorAll('[type=radio][name="'+radioName+'"]'),
            showSelectors     = Toggler.dataAttributes(siblings, 'show'),
            addClassSelectors = Toggler.dataAttributes(siblings, 'addClass'),
            checked

        Array.prototype.forEach.call(siblings, function(r){
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
          Toggler.triggerToggling( checked )
        } else {
          Toggler.setState( showSelectors.join(','), 'hide' )
          Toggler.setClass( addClassSelectors.join(' & '), 'removeClass' )
        }
      }

    })
  },

  // Add data-hide to each <option> containing the selectors from other
  // option's data-show. This makes the toggling of elements exclusive.
  //
  setupSelects: function(){
    Array.prototype.forEach.call(document.querySelectorAll(Toggler.selectSelector), function(option){
      // Prevent an option from being considered twice
      if (!option.dataset.togglerActive) {

        option.dataset.show = option.dataset.show || ''

        var select = Toggler.getSelectFromOption(option)
        select.classList.add('select-toggler')
        var options = select.querySelectorAll('option')

        var showSelectors     = Toggler.dataAttributes(options, 'show')
        var addClassSelectors = Toggler.dataAttributes(options, 'addClass')

        Array.prototype.forEach.call(options, function(o) {
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
        Toggler.triggerToggling(select)
      }
    })
  },

  // Find parent <select> for an option (accounts for option groups)
  //
  getSelectFromOption: function(el) {
    var p = el.parentElement

    if (p.tagName == 'SELECT') {
      return p
    } else {
      return Toggler.getSelectFromOption(p)
    }
  },


  // Find parent <form> or document if there is no form
  //
  parentForm: function(element) {
    var el = element

    while (el && el.tagName != "FORM") {
      el = el.parentNode
    }

    return el || document
  },

  // Return a unique array of all data attribute values from elements
  //
  dataAttributes: function(elements, attr) {
    return Array.prototype.map.call(elements, function(el) { 
      return el.dataset[attr]
    }).filter(function(selectors, index, self) {
      return selectors != "" && typeof selectors != 'undefined' && self.indexOf(selectors) === index
    })
  }
}

Event.ready(Toggler.listen)
Event.change(Toggler.refresh)

module.exports = Toggler
