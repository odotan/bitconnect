function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}
define("RequestTypes", {
	GET: "GET",
	GIVE: "GIVE"
});