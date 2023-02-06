"use strict";
const DocUtils = require("docxtemplater").DocUtils;
DocUtils.convertPixelsToEmus = function (pixel) {
	return Math.round(pixel * 9525);
};
DocUtils.maxArray = function (a) {
	return Math.max.apply(null, a);
};
module.exports = DocUtils;
