"use strict";
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const ImageModule = require("./index.js");
const testutils = require("docxtemplater/js/tests/utils");
const shouldBeSame = testutils.shouldBeSame;
const sizeOf = require("image-size");

const isEs6 = __dirname.endsWith("src");
const examplesDirectory = isEs6 ? path.resolve(__dirname, "..", "examples")
	: path.resolve(__dirname, "..", "..", "examples");
const fileNames = [
	"imageExample.docx",
	"imageHeaderFooterExample.docx",
	"imageLoopExample.docx",
	"imageInlineExample.docx",
	"expectedInline.docx",
	"expectedNoImage.docx",
	"expectedHeaderFooter.docx",
	"expectedOneImage.docx",
	"expectedCentered.docx",
	"expectedLoopCentered.docx",
	"withoutRels.docx",
	"expectedWithoutRels.docx",
	"expectedBase64.docx",
	"tagImage.pptx",
	"expectedTagImage.pptx",
	"tagImageCentered.pptx",
	"expectedTagImageCentered.pptx",
	"expectedInlineResize.docx",
];

beforeEach(function () {
	this.opts = {
		getImage: function (tagValue) {
			return fs.readFileSync(path.resolve(examplesDirectory, tagValue));
		},
		getSize: function () {
			return [150, 150];
		},
		getProps: function () {
			return null;
		},
		centered: false,
	};

	this.loadAndRender = function () {
		/* const file = testutils.createDoc(this.name);
		this.doc = new Docxtemplater();
		const inputZip = new PizZip(file.loadedContent);
		this.doc.loadZip(inputZip).setData(this.data);
		const imageModule = new ImageModule(this.opts);
		this.doc.attachModule(imageModule);
		this.renderedDoc = this.doc.render();
		const doc = this.renderedDoc;
		shouldBeSame({ doc, expectedName: this.expectedName }); */
		const doc = testutils.createDoc(this.name);
		const imageModule = new ImageModule(this.opts);
		doc.attachModule(imageModule);
		doc.render(this.data);
		shouldBeSame({ doc, expectedName: this.expectedName });
	};
});

function testStart() {
	describe("{%image}", function () {
		it("should work with one image", function () {
			this.name = "imageExample.docx";
			this.expectedName = "expectedOneImage.docx";
			this.data = { image: "image.png" };
			this.loadAndRender();
		});

		it("should work without initial rels", function () {
			this.name = "withoutRels.docx";
			this.expectedName = "expectedWithoutRels.docx";
			this.data = { image: "image.png" };
			this.loadAndRender();
		});

		it("should work with image tag == null", function () {
			this.name = "imageExample.docx";
			this.expectedName = "expectedNoImage.docx";
			this.data = {};
			this.loadAndRender();
		});

		it("should work with inline", function () {
			this.name = "imageInlineExample.docx";
			this.expectedName = "expectedInline.docx";
			this.data = { firefox: "image.png" };
			this.loadAndRender();
		});

		it("should work with centering", function () {
			this.name = "imageExample.docx";
			this.expectedName = "expectedCentered.docx";
			this.opts.centered = true;
			this.data = { image: "image.png" };
			this.loadAndRender();
		});

		it("should work with loops", function () {
			this.name = "imageLoopExample.docx";
			this.expectedName = "expectedLoopCentered.docx";
			this.opts.centered = true;
			this.data = { images: ["image.png", "image2.png"] };
			this.loadAndRender();
		});

		it("should work with image in header/footer", function () {
			this.name = "imageHeaderFooterExample.docx";
			this.expectedName = "expectedHeaderFooter.docx";
			this.data = { image: "image.png" };
			this.loadAndRender();
		});

		it("should work with PPTX documents", function () {
			this.name = "tagImage.pptx";
			this.expectedName = "expectedTagImage.pptx";
			this.data = { image: "image.png" };
			this.loadAndRender();
		});

		it("should work with PPTX documents centered", function () {
			this.name = "tagImageCentered.pptx";
			this.expectedName = "expectedTagImageCentered.pptx";
			this.data = { image: "image.png" };
			this.loadAndRender();
		});

		it("should work with auto resize", function () {
			this.name = "imageInlineExample.docx";
			this.expectedName = "expectedInlineResize.docx";
			this.opts.getSize = function (img) {
				const sizeObj = sizeOf(img);
				return [sizeObj.width, sizeObj.height];
			};
			this.data = { firefox: "image.png" };
			this.loadAndRender();
		});

		it("should work with base64 data", function () {
			const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QIJBywfp3IOswAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAkUlEQVQY052PMQqDQBREZ1f/d1kUm3SxkeAF/FdIjpOcw2vpKcRWCwsRPMFPsaIQSIoMr5pXDGNUFd9j8TOn7kRW71fvO5HTq6qqtnWtzh20IqE3YXtL0zyKwAROQLQ5l/c9gHjfKK6wMZjADE6s49Dver4/smEAc2CuqgwAYI5jU9NcxhHEy60sni986H9+vwG1yDHfK1jitgAAAABJRU5ErkJggg==";
			this.name = "imageExample.docx";
			function base64DataURLToArrayBuffer(dataURL) {
				const base64Regex = /^data:image\/(png|jpg|svg|svg\+xml);base64,/;
				if (!base64Regex.test(dataURL)) {
					return false;
				}
				const stringBase64 = dataURL.replace(base64Regex, "");
				let binaryString;
				if (typeof window !== "undefined") {
					binaryString = window.atob(stringBase64);
				}
				else {
					binaryString = Buffer.from(stringBase64, "base64").toString("binary");
				}
				const len = binaryString.length;
				const bytes = new Uint8Array(len);
				for (let i = 0; i < len; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				return bytes.buffer;
			}
			this.opts.getImage = function (image) {
				return image;
			};
			this.expectedName = "expectedBase64.docx";
			this.data = { image: base64DataURLToArrayBuffer(base64Image) };
			this.loadAndRender();
		});
	});
}

testutils.setExamplesDirectory(examplesDirectory);
testutils.setStartFunction(testStart);
fileNames.forEach(function (filename) {
	console.log("Filename: " + filename);
});
testutils.start();
