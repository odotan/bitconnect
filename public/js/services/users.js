window.app.service('UsersService', function($rootScope, $http) {
    var cachedUsers,
        cachedPartialName;
    this.getUsersByPartialName = function getUsersByPartialName(partialName, callback) {
        var usersById = {};
        if (partialName.indexOf(cachedPartialName) === 0) {
            for (var key in cachedUsers) {
                if (cachedUsers.hasOwnProperty(key) && this.userFilter(cachedUsers[key], partialName)) {
                    usersById[key] = cachedUsers[key];
                }
            }
            callback(usersById);
            return;
        }

        $http.get('/autofill?partial=' + partialName)
            .success(function(res) {
                for (var i = 0; i < res.length; i++) {
                    var user = res[i];
                    usersById[user.id] = {
                        username: user.username,
                        id: user.id,
                        fullname: user.fullname
                    };
                }
                cachedPartialName = partialName;
                cachedUsers = usersById;
                callback(usersById);
            });
    }

    this.getUserById = function getUserById(userId, cb) {
        $http.get('/user?userId=' + userId).success(function(res) {
            cb(res);
        });
    };

    /*
     * Returns true iff the given user matches the given partial name, in terms of search criteria.
     */
    this.userFilter = function userFilter(user, partialName) {
        var fullname,
            names,
            enteredNames,
            i = 0;
        if (!user.fullname && user.first_name && user.last_name) {
            fullname = user.first_name + ' ' + user.last_name;
        } else {
            fullname = user.fullname;
        }

        names = fullname.toLowerCase().split(' ');
        enteredNames = partialName.toLowerCase().split(' ');

        for (i = 0; i < enteredNames.length - 1; i++) {
            var nameIndex = names.indexOf(enteredNames[i]);
            if (nameIndex === -1) {
                return false;
            } else {
                names.splice(nameIndex, 1);
            }
        }
        for (i = 0; i < names.length; i++) {
            if (names[i].indexOf(enteredNames[enteredNames.length - 1]) === 0) {
                return true;
            }
        }
        return false;
    }

    /*
     * Combines the source user map into the destination user map.
     * Each user will appear once, with information from both maps.
     * Existing properties of the destination map are not overriden.
     */
    this.combineMaps = function combineMaps(dst, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) {
                if (dst[key]) {
                    for (var userProperty in src[key]) {
                        if (src[key].hasOwnProperty(userProperty)) {
                            dst[key][userProperty] = dst[key][userProperty] || src[key][userProperty];
                        }
                    }
                } else {
                    dst[key] = src[key];
                }
            }
        }
    };
});