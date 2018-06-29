function XmlModel(xml) {
    if (!(this instanceof XmlModel))
        return new XmlModel(xml);

    function getRoot(xml) {
        var struct = $(xml).find("featureModel struct").get();
        if (struct.length !== 1)
            throw "model does not have exactly one struct";
        var children = $(struct[0]).children().get();
        if (children.length !== 1)
            throw "model does not have exactly one root";
        return $(children[0]);
    }

    function getRules() {
        return $(xml).find("constraints rule").map(function() {
            var children = $(this).children(":not(description)").get();
            if (children.length !== 1)
                throw "rule does not have exactly one child";
            return children[0];
        });
    }

    this.xml = xml;
    this.root = getRoot(xml);
    this.rules = getRules();
}

XmlModel.prototype.traverse = function(fn, pushFn, popFn) {    
    function traverse(node, parent, level) {
        if (["feature", "and", "or", "alt"].includes(node.prop("tagName")))
            fn(node, parent, level);
        
        if (node.children().length > 0) {
            if (pushFn)
                pushFn();
            
            node.children().get().forEach(function(child) {
                traverse($(child), node, level + 1);
            });
            
            if (popFn)
                popFn();
        }
    }

    if (pushFn)
        pushFn();
    traverse(this.root, null, 0);
    if (popFn)
        popFn();
}

function Model(xmlModel) {
    if (!(this instanceof Model))
        return new Model(xmlModel);

    function buildFeatureList(xmlModel) {
        var features = [];
        xmlModel.traverse(function(node, parent) {
            features.push(new Feature(node, parent, node.children()));
        });
        return features;
    }

    this.xmlModel = xmlModel;
    this.features = buildFeatureList(xmlModel);
    this.rootFeature = this.features[0];
    this.getFeature = featureGetter("features");
    this.constraintSolver = new ConstraintSolver(this);
}
