function Feature(node, parent, children) {
    if (!(this instanceof Feature))
        return new Feature(node, parent, children);

    function getDescription(node) {
        var description = node.find("> description").get();
        return description.length === 1 ?
            $(description[0]).text().split("\n").map(function(line) { return line.trim(); }).join("\n").trim() :
        null;
    }

    this.name = node.attr("name");
    this.description = getDescription(node);
    this.mandatory = node.attr("mandatory") === "true";
    this.alternative = node.prop("tagName") === "alt";
    this.or = node.prop("tagName") === "or";
    this.parent = parent ? new Feature(parent) : null;

    if (children && (this.alternative || this.or))
        this.children = children.get().filter(function(child) {
            return ["feature", "and", "or", "alt"].includes($(child).prop("tagName"));
        }).map(function(child) {
            return Feature($(child));
        });
}

function featureFinder(name) {
    return function(feature) {
        return feature.name === name;
    };
}

function featureGetter(key) {
    return function(name) {
        return this[key].find(featureFinder(name));
    };
}

function featureName() {
    return function(feature) {
        return feature.name;
    };
}
