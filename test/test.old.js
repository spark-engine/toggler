var fs = require('fs')
var assert = require('chai').assert

var toggler = require('../')
var domify = require('domify')
var event = require('@spark-engine/event')
var $ = function(str) { return document.querySelector(str) }

var templates = {
  click: fs.readFileSync(__dirname + '/templates/click.html', 'utf8'),
  checkbox: fs.readFileSync(__dirname + '/templates/checkbox.html', 'utf8'),
  radio: fs.readFileSync(__dirname + '/templates/radio.html', 'utf8'),
  select: fs.readFileSync(__dirname + '/templates/select.html', 'utf8'),
  fieldset: fs.readFileSync(__dirname + '/templates/fieldsets.html', 'utf8')
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
  return !element.classList.contains('hidden')
}

var hidden = function(element) {
  return element.classList.contains('hidden')
}

var setTemplate = function(name) {
  var previousTest = $('.test-template')
  if (previousTest) document.body.removeChild(previousTest)

  var template = "<div class='test-template'><style>.hidden { display: none }</style>" + templates[name] + "</div>"
  document.body.appendChild(domify(template))
  event.change.fire()
}

describe('Toggler', function(){
  before(function(){
    event.ready.fire()
  })

  describe('click', function(){
    before(function(){
      setTemplate('click')
    })

    it('hides and shows with a click on a data-toggle', function(){
      var menu = $('.menu')
      var toggleEl = $('.toggler')

      event.fire(toggleEl, 'click')
      assert.isTrue(hidden(menu))

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
    it('initializes visibility matching default checked state', function(){
      assert.isTrue($('.hide').checked)
      assert.isTrue(hidden($('.menu')))
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
      assert.equal(checkInput($('.hide')),     hidden($('.menu')))
      assert.equal(uncheckInput($('.hide')),   hidden($('.menu')))
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

    it('initializes visibility matching default checked state', function(){
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
    })

    it('ignores inputs outside of the form', function(){
      // This other radio button is outside of the form
      // if it has a data-show property, radio buttons 
      // are not being scoped to their form.
      assert.isUndefined($('.other-radio').dataset.show)
    })

    it('hides all when none is selected', function(){
      checkInput($('.none'))
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
    })

    it('shows only the first when one is selected', function(){
      checkInput($('.one'))
      assert.isTrue(visible($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
      assert.isTrue(hidden($('.hide-test')))
    })

    it('shows only the second when two is selected', function(){
      checkInput($('.two'))
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(visible($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
    })

    it('shows only the third when three is selected', function(){
      checkInput($('.three'))
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(visible($('.panel-three')))
    })

    it('should remove classnames one,two,three when none is selected', function(){
      checkInput($('.none'))
      assert.isTrue(!$('.panels').classList.contains('one'))
      assert.isTrue(!$('.panels').classList.contains('two'))
      assert.isTrue(!$('.panels').classList.contains('three'))
    })

    it('should add classname one, and remove classnames two,three when selected', function(){
      checkInput($('.one'))
      assert.isTrue($('.panels').classList.contains('one'))
      assert.isTrue(!$('.panels').classList.contains('two'))
      assert.isTrue(!$('.panels').classList.contains('three'))
    })

    it('should add classname two, and remove classnames one,three when selected', function(){
      checkInput($('.two'))
      assert.isTrue(!$('.panels').classList.contains('one'))
      assert.isTrue($('.panels').classList.contains('two'))
      assert.isTrue(!$('.panels').classList.contains('three'))
    })

    it('should add classname three, and remove classnames one,two when selected', function(){
      checkInput($('.three'))
      assert.isTrue(!$('.panels').classList.contains('one'))
      assert.isTrue(!$('.panels').classList.contains('two'))
      assert.isTrue($('.panels').classList.contains('three'))
    })
  })

  describe('select input', function(){
    before(function(){
      setTemplate('select')
    })

    it('initializes visibility matching default selected option', function(){
      assert.isTrue($('.select-toggle').selectedIndex == 2)
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(visible($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
      assert.isTrue(hidden($('.hide-test')))
    })

    it('should hide all panels when none is selected', function(){
      selectIndex($('.select-toggle'), 0)
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
    })

    it('should show panel one and hide panels two and three when one is selected', function(){
      selectIndex($('.select-toggle'), 1)
      assert.isTrue(visible($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
    })

    it('should show panel two and hide panels one and three when two is selected', function(){
      selectIndex($('.select-toggle'), 2)
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(visible($('.panel-two')))
      assert.isTrue(hidden($('.panel-three')))
    })

    it('should show panel three and hide panels one and two when three is selected', function(){
      selectIndex($('.select-toggle'), 3)
      assert.isTrue(hidden($('.panel-one')))
      assert.isTrue(hidden($('.panel-two')))
      assert.isTrue(visible($('.panel-three')))
    })

    it('should remove classnames one,two,three when none is selected', function(){
      selectIndex($('.select-toggle'), 0)
      assert.isTrue(!$('.panels').classList.contains('one'))
      assert.isTrue(!$('.panels').classList.contains('two'))
      assert.isTrue(!$('.panels').classList.contains('three'))

      assert.isTrue($('.select-toggle').classList.contains('none'))
      assert.isTrue(!$('.select-toggle').classList.contains('one'))
      assert.isTrue(!$('.select-toggle').classList.contains('two'))
      assert.isTrue(!$('.select-toggle').classList.contains('three'))
    })

    it('should add classname one, and remove classnames two,three when selected', function(){
      selectIndex($('.select-toggle'), 1)
      assert.isTrue($('.panels').classList.contains('one'))
      assert.isTrue(!$('.panels').classList.contains('two'))
      assert.isTrue(!$('.panels').classList.contains('three'))

      assert.isTrue(!$('.select-toggle').classList.contains('none'))
      assert.isTrue($('.select-toggle').classList.contains('one'))
      assert.isTrue(!$('.select-toggle').classList.contains('two'))
      assert.isTrue(!$('.select-toggle').classList.contains('three'))
    })

    it('should add classname two, and remove classnames one,three when selected', function(){
      selectIndex($('.select-toggle'), 2)
      assert.isTrue(!$('.panels').classList.contains('one'))
      assert.isTrue($('.panels').classList.contains('two'))
      assert.isTrue(!$('.panels').classList.contains('three'))

      assert.isTrue(!$('.select-toggle').classList.contains('none'))
      assert.isTrue(!$('.select-toggle').classList.contains('one'))
      assert.isTrue($('.select-toggle').classList.contains('two'))
      assert.isTrue(!$('.select-toggle').classList.contains('three'))
    })

    it('should add classname three, and remove classnames one,two when selected', function(){
      selectIndex($('.select-toggle'), 3)
      assert.isTrue(!$('.panels').classList.contains('one'))
      assert.isTrue(!$('.panels').classList.contains('two'))
      assert.isTrue($('.panels').classList.contains('three'))

      assert.isTrue(!$('.select-toggle').classList.contains('none'))
      assert.isTrue(!$('.select-toggle').classList.contains('one'))
      assert.isTrue(!$('.select-toggle').classList.contains('two'))
      assert.isTrue($('.select-toggle').classList.contains('three'))
    })
  })

  describe('select fieldset', function(){
    before(function(){
      setTemplate('fieldset')
    })

    it('initializes disabled fieldset matching default selected option', function(){
      assert.isTrue( $('.select-fieldset').selectedIndex == 2 )
      assert.isTrue( $('.panel-one').disabled )
      assert.isTrue( !$('.panel-two').disabled )
      assert.isTrue( $('.panel-three').disabled )
    })

    it('should hide all panels when none is selected', function(){
      selectIndex($('.select-fieldset'), 0)
      assert.isTrue( $('.panel-one').disabled )
      assert.isTrue( $('.panel-two').disabled )
      assert.isTrue( $('.panel-three').disabled )
    })
  })
})
