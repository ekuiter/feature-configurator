function ConfigurationRenderer(configuration, options) {
    if (!(this instanceof ConfigurationRenderer))
        return new ConfigurationRenderer(configuration);

    this.configuration = configuration;
    this.options = this.getOptions(options);
    this.model = configuration.model;
}

ConfigurationRenderer.prototype.render = function() {
    var self = this;
    return self.options.renderAround.call(self, function() {
        var html = "";
        self.model.xmlModel.traverse(function(node) {
            html += self.options.renderFeature.call(self, self.model.getFeature(node.attr("name")));
        }, function() {
            html += "<ul>";
        },  function() {
            html += "</ul>";
        });
        return html;
    });
};

ConfigurationRenderer.prototype.renderTo = function(elem, fn) {
    var self = this;
    self.options.beforeRender.call(self);
    elem.empty().append(self.render());
    
    elem.find("ul li").each(function() {
        var feature = self.model.getFeature($(this).attr("name"));
        if (feature)
            self.options.initializeFeature.call(self, $(this), feature, fn);
    });

    self.options.afterRender.call(self);
};

ConfigurationRenderer.prototype.read = function(elem) {
    var self = this, obj = {
        selectedFeatures: [], deselectedFeatures: []
    };

    elem.find("ul li").each(function() {
        var feature = self.model.getFeature($(this).attr("name"));
        if (feature) {
            var result = self.options.readFeature.call(self, $(this), feature);
            if (result)
                obj[result].push(feature);
        }
    });
    
    return new Configuration(this.model, obj.selectedFeatures, obj.deselectedFeatures);
};

ConfigurationRenderer.prototype.getOptions = function(options) {
    return $.extend({}, {
        beforeRender: function() {},
        afterRender: function() {},
        
        renderAround: function(fn) {
            return fn();
        },

        renderLabel: function(label, feature) {
            return label.text(feature.name).attr("title", feature.description);
        },
        
        renderFeature: function(feature) {
            return $("<div></div>").append($("<li></li>").attr("name", feature.name).
                                           append($("<label></label>").
                                                  append($("<input type=\"checkbox\">")).
                                                  append(this.options.renderLabel.call(this, $("<span></span>"), feature)))).html();
        }, 

        initializeFeature: function(node, feature, fn) {
            node.find("input").
                prop("disabled", !this.configuration.isManual(feature) && this.configuration.isAutomatic(feature)).
                tristate({
                    state: this.configuration.isEnabled(feature) ? true : this.configuration.isDisabled(feature) ? null : false,
                    change: function() {
                        window.setTimeout(fn, 0);
                    }
                });
        },
        
        readFeature: function(node, feature) {
            if (node.find("input").prop("disabled"))
                return;
            if (node.find("input").prop("checked"))
                return "selectedFeatures";
            else if (node.find("input").prop("indeterminate"))
                return "deselectedFeatures";
        }
    }, options);
};
