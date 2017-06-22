# Toggler.js

This is a nice little tool for toggling classnames and visibility on
elements in response to clicks or form element changes. You can do things
like:

- Click a link or button to toggle another element's visibility.
- Link visibility of an element to the state of a checkbox.
- Use radio buttons or select inputs to exclusively show or hide other elments (acting like tabs).
- Do any of the above but change classnames on other elements.

Note: be sure your stylesheets have styles for the `hidden` classname.

## Usage

Toggling elements will have a `data-toggle`, `data-hide`, or `data-show` property whose value contains one or more CSS selectors.

- `data-toggle`: alternately changes visibility by adding or removing a `hidden` or `visible` classname.
- `data-show`: add a `visible` classname, remove a `hidden` classname.
- `data-hide`: add a `hidden` classname, remove a `visible` classname.

When you click an toggling element, it will change the visibility elements matching the CSS selectors. For example:

```
<a href="#" data-toggle='.menu'>Menu</a>
```

Clicking this element will add or remove the class names `hidden` or `visible` on all elements matching the `.menu` selector. You can use multiple selectors too like this.

```
<a href="#" data-toggle='.surprise-party, #cake, .banners, .balloons'>Open Door</a>
```

### Inputs: Checkbox, Radio Button, Select Option

If a toggling element is a checkbox, radio button or a select option toggling works in sync with the state of that input.

With a checkbox, using `data-show` will show an element when checked and hide it when unchecked. Using `data-hide` will invert the toggle; hiding the element when checked and showing it when unchekced.

```html
  <input type='checkbox' data-show='.expanded-options' id='#optional'><label for='#optional'>Show options</label>
  <div class='expanded-options'>…</div>
```

With Radio inputs and selects, the target element for the selected option will be shown and elements targetd by all other options will be hidden.
For this reason, only use `data-show` with radio inputs and selects. The `hide` system is implicit.

```html
<select>
  <option data-show='.cats'>Cats</option>
  <option data-show='.dogs'>Dogs</option>
  <option data-show='.fish'>Fish</option>
</select>
```

Selecting `Cats` will hide `.dogs, .fish`. Also, when the page loads (or when a `page:change` event is fired) Toggler will find all toggling select options and radio buttons and set the visibility
of their target elements to match the current state.

Here's another example:

```html
<select>
  <option>None</option>
  <option data-show='.cats, .dogs'>Mammals</option>
  <option data-show='.fish'>Fish</option>
</select>
```

Selecting:

 - "None" will hide `.cats, .dogs, .fish`. 
 - "Mammals" will hide `.fish`.
 - "Fish" will hide `.cats, .dogs`.

Radio buttons with matching `name` attributes work just like select options. Here's the equivilent HTML for radio buttons.

```html
<input type='radio' name='animal' data-show='.cats' value='cats' id='cats'><label for="#cats">Cats</label>
<input type='radio' name='animal' data-show='.dogs' value='dogs' id='dogs'><label for="#dogs">Dogs</label>
<input type='radio' name='animal' data-show='.fish' value='fish' id='fish'><label for="#fish">Fish</label>
```

### Anchors

Adding the `data-anchor='#name'` attribute to a select `<option>` or radio input, will change the `window.location.hash` property to
match the current selection. Also when a page loads, if the current page anchor matches a `data-anchor` attribute it will select that
option or check that input.

## Toggling Classnames

Much like visiblity toggling, toggling classes with links or buttons works a bit differently than inputs with states.

Class toggling is triggered by the data attributes `data-toggle-class`, `data-add-class`, or `data-remove-class`. Here are some examples values:

- `classname` - add/remove/toggle classname on current element.
- `foo bar` - multiple classnames, separated by spaces (like the html class property).
- `foo bar; .selector` - change classnames on elements matching `.selector`.
- `foo bar; #selector, .selector` - changes classnames on multiple elements.

Toggle the class `active` on a navigation menu when clicking a button.

```html
<button data-toggle-class='active; .nav-menu'>Toggle Navigation</button>
```

You can also change different classnames on multiple elements by using the `&` character. For example:

- `classname & foo; .selector` - add/remove/toggle 'classname' on current element and 'foo' on elements matching `.selector`.
- `highlighted; #selector & active; .selector` - multiple classnames are changed on multiple elements.

### Toggling classes with inputs: Checkbox, Radio Button, Select Option

Again, checkboxes toggle based on the state of the input. With `data-class-toggle`, or `data-class-add`, If a checkbox is checked classes will be added, if unchecked they'll be removed. Also with
`data-class-remove` the behavior will be inverted.

Selects and radio inputs behave much like they do with `data-show`. With each, only `data-add-class` is used. Classes are added based on the selected item and removed based on the items which aren't
selected.

In the follwing example, selecting different inputs will change the class name on elements matching the selector `.some-div`. If the first input is selected. `.some-div` will have the class
`cats` and if it has the classes `dogs` or `fish`, they will be removed.

```html
<input type='radio' data-add-class='cats; .some-div' name='test' id='cats'><label for="#cats">Cats</label>
<input type='radio' data-add-class='dogs; .some-div' name='test' id='dogs'><label for="#dogs">Dogs</label>
<input type='radio' data-add-class='fish; .some-div' name='test' id='fish'><label for="#fish">Fish</label>
```

The next example is the same except, by using the `&` two elements are targetd with the classname changes. In this case, since there are class names but no selectors, the classnames are
added to or removed from the select element. You might do this if you want to style the select differently based on what is chosen.

```html
<select>
  <option data-add-class='cats & cats; .some-div'>Cats</option>
  <option data-add-class='dogs & dogs; .some-div'>Dogs</option>
  <option data-add-class='fish & fish; .some-div'>Fish</option>
</select>
```

For example, when the first option is chosen, the seelct will have the classname `cats` added and elements matching `.some-div` will have the classname `cats` added too. If either of these had
the classnames `dogs` or `fish` those would be removed.

