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

## Toggling Classnames

Class toggling elements will have a `data-toggle-class`, `data-add-class`, or `data-remove-class` property. Here are some examples of values of these attributes:

- "classname" - add/remove/toggle classname on current element.
- "foo bar"   - multiple classnames, separated by spaces (like the html class property).
- "foo bar; .selector" - change classnames on elements matched by selector.
- "foo bar; #selector, .selector" - changes classnames on multiple elements.

Toggle the class `active` on a navigation menu when clicking a button.

```html
  <button data-toggle-class='active; .nav-menu'>Toggle Navigation</button>
```
