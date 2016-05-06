var event = require('compose-event')

var Toggler = {
  checkboxSelector: "[type=checkbox][data-toggle], [type=checkbox][data-show], [type=checkbox][data-hide]",
  radioSelector: "input[type=radio][data-show], input[type=radio][data-add-class]",
  selectSelector: "option[data-show]",

  listen: function(){
    event.on(document, "click change", "[data-toggle], [data-show], [data-hide], [data-toggle-class], [data-add-class], [data-remove-class]", Toggler.trigger)
    event.on(document, "change", ".select-toggler", Toggler.trigger)
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
      target = target.selectedOptions[0]
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

    // Support data-add-class on selects (targets currently selected item
    // TODO: Thinking this is a silly idea.
    //if (select) 
      //Toggler.dispatch(select, 'addClass')
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
        //console.log(el.dataset.addClass, el.dataset.removeClass)
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

      // If there are no selectors, it may be because a select element has
      // 
    } 
    //else if (el.tagName.match(/option|input/i)) {

      //var showSelectors = el.dataset.show
      //var hideSelectors = el.dataset.hide

       //Add classname to shown element
      //if(hideSelectors) {
        //Toggler.setClass(classnames + ';' + hideSelectors, 'remove', el)
      //}

       //Remove classname from shown element
      //if(showSelectors) {
        //Toggler.setClass(classnames + ';' + showSelectors, 'add', el)
      //}

      //return
    //} 
    else {
      // If no slectors are present, use the current el for classnames
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
      if (el.offsetParent === null) {
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

    // Focus on key element if an element expects focus
    var focusEl = el.querySelector('[data-focus]')
    if (focusEl) { focusEl.focus() }

    // Trigger input event on ranges that have been hidden
    var ranges = el.querySelectorAll('[type=range]')
  },

  hide: function(el) {
    el.classList.remove('visible')
    el.classList.add('hidden')
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
      event.fire(node, "toggler:" + eventName)
    })
  },

  toggleCheckboxes: function(checkboxes) {
    checkboxes = checkboxes || document.querySelectorAll(Toggler.checkboxSelector)

    Array.prototype.forEach.call(checkboxes, Toggler.triggerToggling)
  },

  setupRadios: function() {
    Array.prototype.forEach.call(document.querySelectorAll(Toggler.radioSelector), function(radio){
      if (!radio.dataset.togglerActive) {
        var radioName = radio.getAttribute('name')
        var siblings = Toggler.parentForm(radio).querySelectorAll('[type=radio][name="'+radioName+'"]')
        var hideSelectors = Toggler.dataAttributes(siblings, 'show')
        var removeSelectors = Toggler.dataAttributes(siblings, 'addClass')

        Array.prototype.forEach.call(siblings, function(r){
          // Ensure that all radio buttons in a group have a default data-show value of ''
          // This means that unset data-show values are toggle off everything
          //
          r.dataset.show = r.dataset.show || ''
          r.dataset.addClass = r.dataset.addClass || ''

          r.dataset.hide = hideSelectors.filter(function(selector){
            return r.dataset.show != selector
          }).join(',')

          // Ensure that all radio buttons in a group have a default data-add-class value of ''
          // This means that unset data-add-class values are toggle off all classes
          //
          r.dataset.addClass = r.dataset.addClass || ''

          // Ensure that selected radio buttons remove classes according
          // to the deselected radio buttons
          r.dataset.removeClass = removeSelectors.filter(function(selector){
            return r.dataset.addClass != selector
          }).join('&')


          r.dataset.togglerActive = true
        })

      }
      if(radio.checked)
        Toggler.triggerToggling(radio)
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

        var hideSelectors = Toggler.dataAttributes(options, 'show')
        var removeSelectors = Toggler.dataAttributes(options, 'addClass')

        Array.prototype.forEach.call(options, function(o) {
          o.dataset.show = o.dataset.show || ''
          o.dataset.addClass = o.dataset.addClass || ''

          o.dataset.hide = hideSelectors.filter(function(selector){
            return o.dataset.show != selector
          }).join(',')

          o.dataset.removeClass = removeSelectors.filter(function(selector){
            return o.dataset.addClass != selector
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

event.ready(Toggler.listen)
event.change(Toggler.refresh)

module.exports = Toggler
