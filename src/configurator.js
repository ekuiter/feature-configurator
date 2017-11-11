function Configurator(model, options, configuration) {
    if (!(this instanceof Configurator))
        return new Configurator(model, options, configuration);

    this.model = model;
    this.options = options || {};
    this.options.target = this.options.target || $("body");
    this.render(configuration);
}

Configurator.prototype.render = function(configuration) {
    var self = this;
    configuration = configuration || new Configuration(this.model);
    self.configuration = configuration;

    var configurationRenderer = new ConfigurationRenderer(configuration, this.options.renderer);
    configurationRenderer.renderTo(self.options.target, function() {
        self.render(configurationRenderer.read(self.options.target));
    });
};
