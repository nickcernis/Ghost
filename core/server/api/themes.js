var when               = require('when'),
    _                  = require('lodash'),
    canThis            = require('../permissions').canThis,
    config             = require('../config'),
    errors             = require('../errors'),
    settings           = require('./settings'),
    when               = require('when'),
    themes;

// ## Themes
themes = {

    browse: function browse() {
        // **returns:** a promise for a collection of themes in a json object
        return canThis(this).browse.theme().then(function () {
            return when.all([
                settings.read.call({ internal: true }, 'activeTheme'),
                config().paths.availableThemes
            ]).then(function (result) {
                var activeTheme = result[0].settings[0].value,
                    availableThemes = result[1],
                    themes = [],
                    themeKeys = Object.keys(availableThemes);

                _.each(themeKeys, function (key) {
                    if (key.indexOf('.') !== 0
                            && key !== '_messages'
                            && key !== 'README.md'
                            ) {

                        var item = {
                            uuid: key
                        };

                        if (availableThemes[key].hasOwnProperty('package.json')) {
                            item = _.merge(item, availableThemes[key]['package.json']);
                        }

                        item.active = item.uuid === activeTheme;

                        themes.push(item);
                    }
                });

                return { themes: themes };
            });
        }, function () {
            return when.reject(new errors.NoPermissionError('You do not have permission to browse themes.'));
        });
    },

    edit: function edit(themeData) {
        var self = this,
            themeName;

        // Check whether the request is properly formatted.
        if (!_.isArray(themeData.themes)) {
            return when.reject({type: 'BadRequest', message: 'Invalid request.'});
        }

        themeName = themeData.themes[0].uuid;

        return canThis(this).edit.theme().then(function () {
            return themes.browse.call(self).then(function (availableThemes) {
                var theme;

                // Check if the theme exists
                theme = _.find(availableThemes.themes, function (currentTheme) {
                    return currentTheme.uuid === themeName;
                });

                if (!theme) {
                    return when.reject(new errors.BadRequestError('Theme does not exist.'));
                }

                // Activate the theme 
                return settings.edit.call({ internal: true }, 'activeTheme', themeName).then(function () {
                    theme.active = true;
                    return { themes: [theme]};
                });
            });
        }, function () {
            return when.reject(new errors.NoPermissionError('You do not have permission to edit themes.'));
        });
    }
};

module.exports = themes;
