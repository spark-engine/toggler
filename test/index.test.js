var fs = require('fs')
var assert = require('chai').assert

var toggler = require('../')
var domify = require('domify')
var event = require('compose-event')

var templates = {
  click: fs.readFileSync(__dirname + '/templates/click.html', 'utf8'),
  checkbox: fs.readFileSync(__dirname + '/templates/checkbox.html', 'utf8'),
  radio: fs.readFileSync(__dirname + '/templates/radio.html', 'utf8')
}

var checkInput = function(input) {
  input.checked = true
  event.fire(input, 'change')
  return input.checked
}

var uncheckInput = function(input) {
  input.checked = false
  event.fire(input, 'change')
  return input.checked
}

var visible = function(element) {
  return element.offsetParent !== null
}

var setTemplate = function(name) {
  var previousTest = document.querySelector('.test-template')
  if (previousTest) document.body.removeChild(previousTest)

  var template = "<div class='test-template'>" + templates[name] + "</div>"
  document.body.appendChild(domify(template))
  event.fire(document, 'page:change')
}

describe('Toggler', function(){
  before(function(){
    event.fire(document, 'DOMContentLoaded')
    document.body.appendChild(domify('<style>.hidden { display: none; }</style>'))
  })

  describe('click', function(){
    it('changes visibility', function(){
      setTemplate('click')
      var menu = document.querySelector('.menu')
      var toggleEl = document.querySelector('.toggler')

      // Hide with a data-toggle
      event.fire(toggleEl, 'click')
      assert.equal(visible(menu), false)

      // Show with a data-toggle
      event.fire(toggleEl, 'click')
      assert.equal(visible(menu), true)

      // Hide with a data-hide
      event.fire(document.querySelector('.hide'), 'click')
      assert.equal(visible(menu), false)

      // Hide with a data-show
      event.fire(document.querySelector('.show'), 'click')
      assert.equal(visible(menu), true)
    })
  })

  describe('checkboxes', function(){
    it('match check state to visiblity', function(){
      setTemplate('checkbox')
      var toggleBox = document.querySelector('.toggler')
      var hideBox = document.querySelector('.hide')
      var showBox = document.querySelector('.show')
      var menu = document.querySelector('.menu')

      // Check state on data-toggle is linked with visibility
      //
      assert.equal(checkInput(toggleBox),   visible(menu))
      assert.equal(uncheckInput(toggleBox), visible(menu))

      // Check state on data-show is linked with visibility
      assert.equal(checkInput(showBox),     visible(menu))
      assert.equal(uncheckInput(showBox),   visible(menu))

      // Check state on data-hide is opposite with visibility
      //
      assert.equal(checkInput(hideBox),     !visible(menu))
      assert.equal(uncheckInput(hideBox),   !visible(menu))
    })
  })

  describe('radio buttons', function(){
    it('match visibility to selected option', function(){
      setTemplate('radio')

      var one = document.querySelector('.one')
      var two = document.querySelector('.two')
      var three = document.querySelector('.three')

      var panelOne = document.querySelector('.panel-one')
      var panelTwo = document.querySelector('.panel-two')
      var panelThree = document.querySelector('.panel-three')

      // Checking the first option should hide all other options
      //
      assert.equal(checkInput(one), visible(panelOne))
      assert.isFalse(visible(panelTwo))
      assert.isFalse(visible(panelThree))


      // Checking the second option should hide all other options
      //
      assert.equal(checkInput(two), visible(panelTwo))
      assert.isFalse(visible(panelOne))
      assert.isFalse(visible(panelThree))


      // Checking the thrid option should hide all other options
      //
      assert.equal(checkInput(three), visible(panelThree))
      assert.isFalse(visible(panelOne))
      assert.isFalse(visible(panelTwo))
    })
  })
})
