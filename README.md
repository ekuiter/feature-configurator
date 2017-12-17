## feature-configurator

This tool takes a [FeatureIDE](https://featureide.github.io) feature model
([like
this](https://raw.githubusercontent.com/FeatureIDE/FeatureIDE/develop/featuremodels/FeatureIDE/model.xml))
and shows an interface for interactive feature selection and configuration.
Additional constraints are considered as the user selects the desired features.

[Click here](https://ekuiter.github.io/feature-configurator) for an online
demonstration. You should be able to load any consistent FeatureIDE feature
model.

### Intention

[FeatureIDE](https://featureide.github.io) already provides a powerful
configuration editor, but to use it, one needs to install Eclipse and
FeatureIDE. For a software product line developer, this might be reasonable, but
for an end user of such a product line this process might be too involved.

Suppose a software product line should be fully configurable for the end user:
Ideally, the user can just visit a web page, tick a few boxes and then download
a software product tailored to his needs. This can be seen in a few instances
like [jQuery UI](http://jqueryui.com/download/) or [Zurb
Foundation](https://foundation.zurb.com/sites/download.html/#customizeFoundation),
but it seems there is no general solution compatible with software product line
tools such as FeatureIDE.

This project is an attempt to bring FeatureIDE-like configuration editing into
the browser. It generates a FeatureIDE-compliant configuration file that can be
used by further tooling on the server side.

(Also see
[ekuiter/feature-model-viz](https://github.com/ekuiter/feature-model-viz) for
visualizing feature models and
[ekuiter/feature-php](https://github.com/ekuiter/feature-php) for server-side
tooling.)

### Implementation

Feature and cross-tree constraints specified in the model are propagated as
described in the book [Feature-Oriented Software Product
Lines](http://www.springer.com/de/book/9783642375200) in Chapter 10. The feature
model is transformed into propositional logic using [Logic
Solver](https://github.com/meteor/logic-solver), then a SAT solver
([MiniSat](http://minisat.se/) compiled for JavaScript) resolves (de-)activated
features.

This implementation is not optimized for speed, thus it may slow down on large
feature models. Another downside is that, because of the SAT solver, the JS
bundle is >300KB. On the other side, no server side code is needed, making the
solution fast and responsive for feature models of moderate size.

### Usage

Run `npm install feature-configurator` in your project directory
([NPM](https://www.npmjs.com/) required). Then include the `bundle.js` file as
shown in the example below. Additionally, [jQuery](http://jquery.com/) and
[jQuery Tristate](https://github.com/vanderlee/tristate) need to be included.

#### XmlModel

To retrieve and parse a feature model, use the XmlModel class:

```js
var xmlModel = new XmlModel(
  $.parseXML("<featureModel>(...)</featureModel>") // you can use jQuery to parse an XML string
);
// ... use xmlModel ...
```

To load a feature model stored on the server at `./model.xml`:

```js
$.ajax("model.xml").then(function(xml) {
  var xmlModel = new XmlModel(
    xml // this is already parsed by jQuery
  );
  // ... use xmlModel ...
});
```

#### Configurator

Then use the Configurator class as follows to render the default feature
configurator to the whole page:

```js
var configurator = new Configurator( // the feature configurator
  new Model(xmlModel) // contains the feature model and its constraints
);
```

You can supply more options to customize the feature configurator:

```js
var model = new Model(xmlModel); // contains the feature model and its constraints
var configurator = new Configurator( // the feature configurator
  model,
  
  { // additional options
    target: $("#some-element"), // where to render the configurator, defaults to $("body")
    renderer: { // options for the ConfigurationRenderer
      // in every function below "this" refers to the ConfigurationRenderer,
      // so you can access this.configuration and this.model
      beforeRender: function() {}, // hook called before rendering
      afterRender: function() {}, // hook called after rendering
      renderAround: function(fn) { // use this to supply additional HTML on each rerender
        return /* header HTML */ + fn() + /* footer HTML */;
      },
      renderLabel: function(label, feature) { // use this to adjust feature labeling
        return label.text(feature.name).attr("title", feature.description);
      },
      renderFeature: function(feature) { // use this to further adjust feature rendering
         return /* a named li element with a checkbox, see configuration-renderer.js */;
      }, 
      initializeFeature: function(node, feature, fn) { // adjust feature elements after insertion to DOM
            /* maybe disable checkbox, set correct tristate, bind change event, see configuration-renderer.js */
      },
      readFeature: function(node, feature) { // change how to read new selections from the DOM
        if (/* feature is selected */)
          return "selectedFeatures";
        else if (/* feature is deselected */)
          return "deselectedFeatures";
      }
    }
  },

  // the initial configuration, defaults to the empty configuration
  // if supplied, the configuration is loaded from a FeatureIDE configuration file
  Configuration.fromXml(model, configurationXml)
);
```

### Example

[This
example](https://github.com/ekuiter/feature-configurator/blob/gh-pages/index.html)
loads a given feature model and then renders a configurator for it.
Configurations can be exported as XML. You can [try it
online](https://ekuiter.github.io/feature-configurator).

### License

This project is released under the [LGPL v3 license](LICENSE.txt).