function ConstraintSolver(model) {
    if (!(this instanceof ConstraintSolver))
        return new ConstraintSolver(model);
    var self = this;
    var solver = this.solver = new Logic.Solver();

    function getCrossTreeConstraints() {
        return model.xmlModel.rules.get().map(self.crossTreeConstraint.bind(self));
    }

    var featureConstraintSemantics = [
        function root(feature) {
            if (!feature.parent)
                return feature.name;
        },

        function mandatory(feature) {
            if (feature.parent && feature.mandatory)
                return Logic.equiv(feature.name, feature.parent.name);
        },

        function optional(feature) {
            if (feature.parent)
                return Logic.implies(feature.name, feature.parent.name);
        },

        function alternative(feature) {
            if (feature.alternative) {
                var children = feature.children.map(featureName());

                var alternativeConstraints = [];
                for (var i = 0; i < children.length; i++)
                    for (var j = 0; j < i; j++)
                        alternativeConstraints.push(Logic.not(Logic.and(children[i], children[j])));
                
                return Logic.and(Logic.equiv(feature.name, Logic.or(children)), alternativeConstraints);
            }
        },

        function or(feature) {
            if (feature.or) {
                var children = feature.children.map(featureName());
                return Logic.equiv(feature.name, Logic.or(children));
            }
        }
    ];

    model.features.forEach(function(feature) {
        featureConstraintSemantics.forEach(function(semantics) {
            var formula = semantics(feature);
            if (formula)
                solver.require(formula);
        });
    });

    getCrossTreeConstraints().forEach(function(constraint) {
        solver.require(constraint);
    });
}

ConstraintSolver.prototype.crossTreeConstraint = function(rule) {
    var self = this, op = rule.tagName, num = $(rule).children().length;

    function constrainedChild(n) {
        return self.crossTreeConstraint($(rule).children()[n]);
    }
    
    if (op === "eq" && num === 2)
        return Logic.equiv(constrainedChild(0), constrainedChild(1));
    if (op === "imp" && num === 2)
        return Logic.implies(constrainedChild(0), constrainedChild(1));
    if (op === "conj" && num === 2)
        return Logic.and(constrainedChild(0), constrainedChild(1));
    if (op === "disj" && num === 2)
        return Logic.or(constrainedChild(0), constrainedChild(1));
    if (op === "not" && num === 1)
        return Logic.not(constrainedChild(0));
    if (op === "var" && num === 0)
        return $(rule).text();
    
    throw "unknown operation " + op + " with " + num + " arguments encountered";
};

ConstraintSolver.prototype.configurationConstraint = function(configuration) {
    return Logic.and(configuration.selectedFeatures.map(featureName()),
                     configuration.deselectedFeatures.map(featureName()).map(function(feature) {
                         return Logic.not(feature);
                     }));
};

ConstraintSolver.prototype.isValid = function(configuration) {
    return !!this.solver.solveAssuming(this.configurationConstraint(configuration));
};

ConstraintSolver.prototype.isDeactivated = function(configuration, feature) {
    return !this.solver.solveAssuming(Logic.and(this.configurationConstraint(configuration), feature.name));
};

ConstraintSolver.prototype.isActivated = function(configuration, feature) {
    return !this.solver.solveAssuming(Logic.and(this.configurationConstraint(configuration), Logic.not(feature.name)));
};
