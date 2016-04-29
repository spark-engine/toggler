var fs = require('fs')
var assert = require('chai').assert

var toggler = require('../')
var domify = require('domify')
var event = require('compose-event')
var $ = function(str) { return document.querySelector(str) }

var templates = {
  click: fs.readFileSync(__dirname + '/templates/click.html', 'utf8'),
  checkbox: fs.readFileSync(__dirname + '/templates/checkbox.html', 'utf8'),
  radio: fs.readFileSync(__dirname + '/templates/radio.html', 'utf8'),
  select: fs.readFileSync(__dirname + '/templates/select.html', 'utf8')
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

var selectIndex = function(input, index) {
  input.selectedIndex = index
  event.fire(input, 'change')
}

var visible = function(element) {
  return element.offsetParent !== null
}

var setTemplate = function(name) {
  var previousTest = $('.test-template')
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
    before(function(){
      setTemplate('click')
    })

    it('hides and shows with a click on a data-toggle', function(){
      var menu = $('.menu')
      var toggleEl = $('.toggler')

      event.fire(toggleEl, 'click')
      assert.isTrue(!visible(menu))

      event.fire(toggleEl, 'click')
      assert.isTrue(visible(menu))
    })

    it('hides with click data-hide', function(){
      event.fire($('.hide'), 'click')
      assert.isFalse(visible($('.menu')))
    })

    it('shows with click data-show', function(){
      event.fire($('.show'), 'click')
      assert.isTrue(visible($('.menu')))
    })

    // Classname toggling
    //
    it('toggles its own classnames when clicking a data-toggle-class', function(){
      event.fire($('.menu'), 'click')
      assert.isTrue($('.menu').classList.contains('active'))

      event.fire($('.menu'), 'click')
      assert.isTrue(!$('.menu').classList.contains('active'))
    })

    it('toggles target element classnames when clicking a data-toggle-class', function(){
      event.fire($('.toggle-class'), 'click')
      assert.isTrue($('.menu').classList.contains('active'))

      event.fire($('.toggle-class'), 'click')
      assert.isTrue(!$('.menu').classList.contains('active'))
    })

    it('removes class names when clicking a data-toggle-class', function(){
      event.fire($('.remove'), 'click')
      assert.isTrue(!$('.menu').classList.contains('active'))
    })

    it('adds class names when clicking a data-toggle-class', function(){
      event.fire($('.add'), 'click')
      assert.isTrue($('.menu').classList.contains('active'))
    })
  })

  describe('checkbox', function(){
    before(function(){
      setTemplate('checkbox')
    })

    it('matches data-toggle state with visibility', function(){
      assert.equal(checkInput($('.toggler')),   visible($('.menu')))
      assert.equal(uncheckInput($('.toggler')), visible($('.menu')))
    })

    it('matches data-show state with visibility', function(){
      assert.equal(checkInput($('.show')),     visible($('.menu')))
      assert.equal(uncheckInput($('.show')),   visible($('.menu')))
    })

    it('inverts data-hide state with visibility', function(){
      assert.equal(checkInput($('.hide')),     !visible($('.menu')))
      assert.equal(uncheckInput($('.hide')),   !visible($('.menu')))
    })

    // Classname toggling
    //
    it('matches data-toggle-class state with active classname', function(){
      assert.equal(checkInput($('.toggle-class')),   $('.menu').classList.contains('active'))
      assert.equal(uncheckInput($('.toggle-class')), $('.menu').classList.contains('active'))
    })

    it('matches data-add-class state with active classname', function(){
      assert.equal(checkInput($('.add')),   $('.menu').classList.contains('active'))
      assert.equal(uncheckInput($('.add')), $('.menu').classList.contains('active'))
    })

    it('inverts data-remove-class state with active classname', function(){
      assert.equal(checkInput($('.remove')),   !$('.menu').classList.contains('active'))
      assert.equal(uncheckInput($('.remove')), !$('.menu').classList.contains('active'))
    })
  })

  describe('radio buttons', function(){
    before(function(){
      setTemplate('radio')
    })

    it('hides all when none is selected', function(){
      checkInput($('.none'))
      assert.isTrue(!visible($('.panel-one')))
      assert.isTrue(!visible($('.panel-two')))
      assert.isTrue(!visible($('.panel-three')))
    })

    it('shows only the first when one is selected', function(){
      checkInput($('.one'))
      assert.isTrue(visible($('.panel-one')))
      assert.isTrue(!visible($('.panel-two')))
      assert.isTrue(!visible($('.panel-three')))
    })

    it('shows only the second when two is selected', function(){
      checkInput($('.two'))
      assert.isTrue(!visible($('.panel-one')))
      assert.isTrue(visible($('.panel-two')))
      assert.isTrue(!visible($('.panel-three')))
    })

    it('shows only the third when three is selected', function(){
      checkInput($('.three'))
      assert.isTrue(!visible($('.panel-one')))
      assert.isTrue(!visible($('.panel-two')))
      assert.isTrue(visible($('.panel-three')))
    })
  })

  describe('select input', function(){
    before(function(){
      setTemplate('select')
    })

    it('should hide all panels when none is selected', function(){
      selectIndex($('.select-toggle'), 0)
      assert.isTrue(!visible($('.panel-one')))
      assert.isTrue(!visible($('.panel-two')))
      assert.isTrue(!visible($('.panel-three')))
    })

    it('should show panel one and hide panels two and three when one is selected', function(){
      selectIndex($('.select-toggle'), 1)
      assert.isTrue(visible($('.panel-one')))
      assert.isTrue(!visible($('.panel-two')))
      assert.isTrue(!visible($('.panel-three')))
    })

    it('should show panel two and hide panels one and three when two is selected', function(){
      selectIndex($('.select-toggle'), 2)
      assert.isTrue(!visible($('.panel-one')))
      assert.isTrue(visible($('.panel-two')))
      assert.isTrue(!visible($('.panel-three')))
    })

    it('should show panel three and hide panels one and two when three is selected', function(){
      selectIndex($('.select-toggle'), 3)
      assert.isTrue(!visible($('.panel-one')))
      assert.isTrue(!visible($('.panel-two')))
      assert.isTrue(visible($('.panel-three')))
    })
  })
})
