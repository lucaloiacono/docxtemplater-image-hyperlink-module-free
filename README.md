# Open Source docxtemplater image module with Hyperlink support

This repository holds a maintained version of docxtemplater image module.

This package is open source. There is also a [paid version](https://docxtemplater.com/modules/image/) maintained by docxtemplater author.

Note this version is compatible with docxtemplater 3.x.

## Installation

You first need to install docxtemplater by following its [installation guide](https://docxtemplater.readthedocs.io/en/latest/installation.html).

### Node

For Node.js install this package:
```bash
npm i docxtemplater-image-hyperlink-module-free
```
Builds are located in `build/node` directory.

To build your own just run
```bash
npm run compile
```

### Browser

Builds are located in `build/browser` directory.

Alternatively, you can create your own build from the sources:
```bash
npm run compile
npm run browserify
npm run uglify
```

## Usage

Assuming your **docx** or **pptx** template contains only the text `{%image}`:
```javascript
// Node.js example
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const ImageModule = require('docxtemplater-image-hyperlink-module-free');

const fs = require("fs");
const path = require("path");

// Below the options that will be passed to ImageModule instance
const imageOpts = {
    centered: false, // Set to true to always center images
    fileType: "docx", // Or pptx
    // Pass your image loader
    getImage: function (tagValue, tagName) {
        return fs.readFileSync(tagValue);
    },
    // Pass the function that returns image size
    getSize: function (img, tagValue, tagName) {
        // It also is possible to return a size in centimeters, like this : return [ "2cm", "3cm" ];
        return [150, 150];
    },
    // Pass the function that returns image properties
    getProps: function(tagValue, tagName) {
        // Filter by tagName, replace with yours
        // For instance, tagName is 'image'
        if (tagName === 'image') {
            return {
                link: 'https://domain.example',
            };
        }
        /*
        * If you don't want to change the props
        * for a given tagName, just return null
        */
        return null;
    }
};

// Load the docx file as binary content
const content = fs.readFileSync(
    path.resolve(__dirname, "input.docx"),
    "binary"
);

const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
    modules: [new ImageModule(imageOpts)],
});
doc.render({ image: "examples/image.png" });

const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
});

fs.writeFile("test.docx", buffer);
```

Some notes regarding templates:
* **docx** files: the placeholder `{%image}` must be in a dedicated paragraph.
* **pptx** files: the placeholder `{%image}` must be in a dedicated text cell.

In the browser, this shows how to get the image asynchronously :

```html
<html>
    <script src="node_modules/docxtemplater/build/docxtemplater.js"></script>
    <script src="node_modules/pizzip/dist/pizzip.js"></script>
    <script src="node_modules/pizzip/vendor/FileSaver.js"></script>
    <script src="node_modules/pizzip/dist/pizzip-utils.js"></script>
    <script src="build/browser/imagemodule.js"></script>
    <script>
        docxType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        PizZipUtils.getBinaryContent(
            "examples/image-example.docx",
            function (error, content) {
                if (error) {
                    console.error(error);
                    return;
                }
                const imageOpts = {
                    centered: false,
                    getImage: function (tagValue, tagName) {
                        return new Promise(function (
                            resolve,
                            reject
                        ) {
                            PizZipUtils.getBinaryContent(
                                tagValue,
                                function (error, content) {
                                    if (error) {
                                        return reject(error);
                                    }
                                    return resolve(content);
                                }
                            );
                        });
                    },
                    getSize: function (img, tagValue, tagName) {
                        // FOR FIXED SIZE IMAGE :
                        return [150, 150];

                        // FOR IMAGE COMING FROM A URL (IF TAGVALUE IS AN ADDRESS) :
                        // To use this feature, you have to be using docxtemplater async
                        // (if you are calling render(), you are not using async).
                        return new Promise(function (
                            resolve,
                            reject
                        ) {
                            const image = new Image();
                            image.src = url;
                            image.onload = function () {
                                resolve([
                                    image.width,
                                    image.height,
                                ]);
                            };
                            image.onerror = function (e) {
                                console.log(
                                    "img, tagValue, tagName : ",
                                    img,
                                    tagValue,
                                    tagName
                                );
                                alert(
                                    "An error occured while loading " +
                                        tagValue
                                );
                                reject(e);
                            };
                        });
                    },
                    getProps: function(tagValue, tagName) {
                        // Filter by tagName, replace with yours
                        // For instance, tagName is 'image'
                        if (tagName === 'image') {
                            return {
                                link: 'https://domain.example',
                            };
                        }
                        /*
                        * If you don't want to change the props
                        * for a given tagName, just return null
                        */
                        return null;
                    }
                };

                const zip = new PizZip(content);
                const doc = new docxtemplater(zip, {
                    modules: [new ImageModule(imageOpts)],
                });

                doc.renderAsync({
                    image: "examples/image.png",
                }).then(function () {
                    const out = doc.getZip().generate({
                        type: "blob",
                        mimeType: docxType,
                    });
                    saveAs(out, "generated.docx");
                });
            }
        );
    </script>

</html>
```

## Centering images

You can center all images by setting the global switch to true `imageOpts.centered = true`.

If you would like to choose which images should be centered one by one:
* Set the global switch to false `imageOpts.centered = false`.
* Use `{%image}` for images that shouldn't be centered.
* Use `{%%image}` for images that you would like to see centered.

In **pptx** generated documents, images are centered vertically and horizontally relative to the parent cell.

## Fetch image from url

It is possible to get images asynchronously by returning a Promise in the `getImage` function and use the docxtemplater async api : http://docxtemplater.readthedocs.io/en/latest/async.html

Here is an example in node that allows you to retrieve values from an URL and use a fixed width, and keep the aspect ratio.

```js
const fs = require("fs");
const Docxtemplater = require("docxtemplater");
const https = require("https");
const http = require("http");
const Stream = require("stream").Transform;
const ImageModule = require("docxtemplater-image-module");
const PizZip = require("pizzip");

const content = fs.readFileSync("demo_template.docx");

const data = { image: "https://docxtemplater.com/xt-pro.png" };

const imageOpts = {
    getImage: function (tagValue, tagName) {
        console.log(tagValue, tagName);
        const base64Value = base64Parser(tagValue);
        if (base64Value) {
            return base64Value;
        }
        // tagValue is "https://docxtemplater.com/xt-pro-white.png"
        // tagName is "image"
        return new Promise(function (resolve, reject) {
            getHttpData(tagValue, function (err, data) {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    },
    getSize: function (img, tagValue, tagName) {
        console.log(tagValue, tagName);
        // img is the value that was returned by getImage
        // This is to force the width to 600px, but keep the same aspect ratio
        const sizeOf = require("image-size");
        const sizeObj = sizeOf(img);
        console.log(sizeObj);
        const forceWidth = 600;
        const ratio = forceWidth / sizeObj.width;
        return [
            forceWidth,
            // calculate height taking into account aspect ratio
            Math.round(sizeObj.height * ratio),
        ];
    },
    getProps: function(tagValue, tagName) {
        // Filter by tagName, replace with yours
        // For instance, tagName is 'image'
        if (tagName === 'image') {
            return {
                link: 'https://domain.example',
            };
        }
        /*
        * If you don't want to change the props
        * for a given tagName, just return null
        */
        return null;
    }
};

const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
    modules: [new ImageModule(imageOpts)],
});

doc.renderAsync(data)
    .then(function () {
        const buffer = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        fs.writeFileSync("test.docx", buffer);
        console.log("rendered");
    })
    .catch(function (error) {
        console.log("An error occured", error);
    });

// Returns a Promise<Buffer> of the image
function getHttpData(url, callback) {
    (url.substr(0, 5) === "https" ? https : http)
        .request(url, function (response) {
            if (response.statusCode !== 200) {
                return callback(
                    new Error(
                        `Request to ${url} failed, status code: ${response.statusCode}`
                    )
                );
            }

            const data = new Stream();
            response.on("data", function (chunk) {
                data.push(chunk);
            });
            response.on("end", function () {
                callback(null, data.read());
            });
            response.on("error", function (e) {
                callback(e);
            });
        })
        .end();
}
```

## Dynamic image loader based on placeholder

You can have customizable image loader using the template's placeholder name.

```js
const imageOpts = {
    getImage: function (tagValue, tagName) {
        if (tagName === "logo")
            return fs.readFileSync(
                __dirname + "/logos/" + tagValue
            );

        return fs.readFileSync(
            __dirname + "/images/" + tagValue
        );
    },
};
```

The same thing can be used to customize image size.

```js
const imageOpts = {
    getSize: function (img, tagValue, tagName) {
        if (tagName === "logo") return [100, 100];

        return [300, 300];
    },
};
```

And image properties.

```js
const imageOpts = {
    getProps: function (img, tagValue, tagName) {
        if (tagName === "logo") return {
            link: "https://mycompany.com";
        };

        return {
            link: "https://defaultlink.com";
        }
    },
};
```

## Base64 include

You can use base64 images with the following code:

```js
function base64DataURLToArrayBuffer(dataURL) {
  const base64Regex = /^data:image\/(png|jpg|svg|svg\+xml);base64,/;
  if (!base64Regex.test(dataURL)) {
    return false;
  }
  const stringBase64 = dataURL.replace(base64Regex, "");
  let binaryString;
  if (typeof window !== "undefined") {
    binaryString = window.atob(stringBase64);
  } else {
    binaryString = new Buffer(stringBase64, "base64").toString("binary");
  }
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const ascii = binaryString.charCodeAt(i);
    bytes[i] = ascii;
  }
  return bytes.buffer;
}
const imageOpts = {
  getImage(tag) {
    return base64DataURLToArrayBuffer(tag);
  },
  getSize() {
    return [100, 100];
  },
  getProps() {
    return {
        link: "https://domain.example"
    };
  }
};
doc.attachModule(new ImageModule(imageOpts));
```

 