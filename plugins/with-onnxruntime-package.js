const {
  createRunOncePlugin,
  withMainApplication,
} = require("@expo/config-plugins");

const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");

const PLUGIN_NAME = "with-onnxruntime-package";
const PLUGIN_VERSION = "1.0.0";

function withOnnxruntimePackage(config) {
  return withMainApplication(config, (config) => {
    if (config.modResults.language !== "kt") {
      throw new Error(
        `${PLUGIN_NAME} currently supports Kotlin MainApplication files only.`,
      );
    }

    let contents = config.modResults.contents;

    contents = mergeContents({
      src: contents,
      newSrc: "import ai.onnxruntime.reactnative.OnnxruntimePackage",
      tag: "onnxruntime-package-import",
      anchor: /^import com\.facebook\.react\.PackageList$/m,
      offset: 1,
      comment: "//",
    }).contents;

    contents = mergeContents({
      src: contents,
      newSrc: "          add(OnnxruntimePackage())",
      tag: "onnxruntime-package-registration",
      anchor: /^\s*PackageList\(this\)\.packages\.apply \{$/m,
      offset: 1,
      comment: "          //",
    }).contents;

    config.modResults.contents = contents;

    return config;
  });
}

module.exports = createRunOncePlugin(
  withOnnxruntimePackage,
  PLUGIN_NAME,
  PLUGIN_VERSION,
);
